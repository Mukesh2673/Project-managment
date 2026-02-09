import { Ticket } from '@/types'
import mysql from 'mysql2/promise'

// Database connection pool
let pool: mysql.Pool | null = null

// Test database connection
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const connection = await getPool().getConnection()
    await connection.ping()
    connection.release()
    return { success: true, message: 'Database connection successful' }
  } catch (error: any) {
    const host = process.env.DB_HOST || 'localhost'
    let message = `Database connection failed: ${error.message}`
    
    if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo ENOTFOUND')) {
      message = `Cannot resolve database hostname: ${host}. Please verify:\n` +
        `1. DB_HOST environment variable is correct\n` +
        `2. Database service is running (check Aiven dashboard)\n` +
        `3. Network connectivity is working\n` +
        `4. For Aiven: Ensure service is active and hostname hasn't changed`
    }
    
    return { success: false, message }
  }
}

// Initialize database connection pool
export function getPool(): mysql.Pool {
  if (!pool) {
    const sslRequired = process.env.DB_SSL_MODE === 'REQUIRED' || process.env.DB_SSL === 'true'
    
    // Validate required environment variables
    const host = process.env.DB_HOST || 'localhost'
    const port = parseInt(process.env.DB_PORT || '3306')
    const user = process.env.DB_USER || 'root'
    const password = process.env.DB_PASSWORD || ''
    const database = process.env.DB_NAME || 'project_management'
    
    // Log configuration (without sensitive data) for debugging
    console.log('Database connection config:', {
      host,
      port,
      user,
      database: database,
      sslRequired,
      hasPassword: !!password
    })
    
    const poolConfig: mysql.PoolOptions = {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 30000, // 30 seconds timeout for DNS resolution
    }

    // Configure SSL if required
    if (sslRequired) {
      poolConfig.ssl = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
      
      // If CA certificate path is provided, use it
      if (process.env.DB_SSL_CA) {
        const fs = require('fs')
        poolConfig.ssl.ca = fs.readFileSync(process.env.DB_SSL_CA)
      }
    }

    pool = mysql.createPool(poolConfig)
  }
  return pool
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain errors
      if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_BAD_DB_ERROR') {
        throw error
      }
      
      // Only retry on DNS/network errors
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt)
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      
      throw error
    }
  }
  
  throw lastError
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  return retryWithBackoff(async () => {
    let connection: mysql.PoolConnection | null = null
    try {
      connection = await getPool().getConnection()
      
      // Test connection first
      await connection.ping()
      console.log('✓ Database connection successful')
      
      // Create tickets table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT NOT NULL,
          status ENUM('todo', 'in-progress', 'review', 'done') NOT NULL DEFAULT 'todo',
          priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
          assignee VARCHAR(255),
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          INDEX idx_status (status),
          INDEX idx_priority (priority),
          INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Tickets table created or already exists')

      // Create users table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user', 'viewer') NOT NULL DEFAULT 'user',
          avatar VARCHAR(500),
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_email (email),
          INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Users table created or already exists')

      // Create projects table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          owner_id VARCHAR(255) NOT NULL,
          status ENUM('active', 'archived', 'completed') NOT NULL DEFAULT 'active',
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_owner_id (owner_id),
          INDEX idx_status (status),
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('✓ Projects table created or already exists')

      // Update tickets table to include project_id (check if column exists first)
      const [columns] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tickets' AND COLUMN_NAME = 'project_id'"
      ) as [any[], any]
      
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE tickets 
          ADD COLUMN project_id VARCHAR(255),
          ADD INDEX idx_project_id (project_id)
        `).catch((err: any) => {
          console.log('Note: Could not add project_id column:', err.message)
        })
        
        // Add foreign key separately (may fail if projects table doesn't exist yet)
        try {
          await connection.query(`
            ALTER TABLE tickets 
            ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
          `)
        } catch (err: any) {
          console.log('Note: Foreign key constraint may already exist or will be added later')
        }
      }
      
      console.log('✓ Database initialized successfully')
    } catch (error: any) {
      console.error('✗ Error initializing database:', error.message)
      
      // Provide helpful error messages
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || error.message?.includes('getaddrinfo')) {
        const host = process.env.DB_HOST || 'localhost'
        throw new Error(
          `Cannot resolve database hostname: ${host}\n\n` +
          `Troubleshooting steps:\n` +
          `1. Verify the DB_HOST in your .env file matches the Aiven dashboard\n` +
          `2. Check if your Aiven MySQL service is running (not paused)\n` +
          `3. Verify your internet connection is working\n` +
          `4. Try refreshing the connection details in Aiven dashboard\n` +
          `5. If the hostname changed, update DB_HOST in .env file\n\n` +
          `Current hostname: ${host}\n` +
          `Test DNS: nslookup ${host}`
        )
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Connection refused to ${process.env.DB_HOST}:${process.env.DB_PORT}\n` +
          `Please check:\n` +
          `1. The database server is running\n` +
          `2. The port number is correct\n` +
          `3. Firewall rules allow connections`
        )
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(
          `Connection timeout to ${process.env.DB_HOST}\n` +
          `Please check:\n` +
          `1. The database server is accessible\n` +
          `2. Network connectivity is working\n` +
          `3. Firewall rules allow connections`
        )
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        throw new Error(
          `Access denied for user '${process.env.DB_USER}'\n` +
          `Please check:\n` +
          `1. The DB_USER and DB_PASSWORD are correct\n` +
          `2. The user has proper permissions`
        )
      }
      
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }, 3, 2000) // 3 retries with 2s initial delay
}

// Read all tickets
export async function getTickets(): Promise<Ticket[]> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT * FROM tickets ORDER BY createdAt DESC'
    ) as [Ticket[], any]
    
    return rows.map((ticket: any) => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
    }))
  } catch (error) {
    console.error('Error fetching tickets:', error)
    throw new Error('Failed to fetch tickets')
  } finally {
    connection.release()
  }
}

// Get a single ticket by ID
export async function getTicketById(id: string): Promise<Ticket | null> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, title, description, status, priority, assignee, assignee_id as assigneeId, created_by as createdBy, created_at as createdAt, updated_at as updatedAt FROM tickets WHERE id = ?',
      [id]
    ) as [any[], any]
    
    if (rows.length === 0) {
      return null
    }
    
    const ticket = rows[0]
    return {
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
    }
  } catch (error) {
    console.error('Error fetching ticket:', error)
    throw new Error('Failed to fetch ticket')
  } finally {
    connection.release()
  }
}

// Create a new ticket
export async function createTicket(
  ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Ticket> {
  const connection = await getPool().getConnection()
  try {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const now = new Date()
    
    await connection.query(
      `INSERT INTO tickets (id, title, description, status, priority, assignee, assignee_id, created_by, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ticketData.title,
        ticketData.description,
        ticketData.status,
        ticketData.priority,
        ticketData.assignee || null,
        ticketData.assigneeId || null,
        ticketData.createdBy || null,
        now,
        now,
      ]
    )
    
    const ticket = await getTicketById(id)
    if (!ticket) {
      throw new Error('Failed to retrieve created ticket')
    }
    return ticket
  } catch (error: any) {
    console.error('Error creating ticket:', error)
    // Include the actual error message for debugging
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    console.error('Error details:', { errorMessage, errorCode, sqlState: error?.sqlState })
    throw new Error(`Failed to create ticket: ${errorMessage} (Code: ${errorCode})`)
  } finally {
    connection.release()
  }
}

// Update an existing ticket
export async function updateTicket(
  id: string,
  ticketData: Partial<Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Ticket | null> {
  const connection = await getPool().getConnection()
  try {
    const updateFields: string[] = []
    const values: any[] = []
    
    if (ticketData.title !== undefined) {
      updateFields.push('title = ?')
      values.push(ticketData.title)
    }
    if (ticketData.description !== undefined) {
      updateFields.push('description = ?')
      values.push(ticketData.description)
    }
    if (ticketData.status !== undefined) {
      updateFields.push('status = ?')
      values.push(ticketData.status)
    }
    if (ticketData.priority !== undefined) {
      updateFields.push('priority = ?')
      values.push(ticketData.priority)
    }
    if (ticketData.assignee !== undefined) {
      updateFields.push('assignee = ?')
      values.push(ticketData.assignee || null)
    }
    if (ticketData.assigneeId !== undefined) {
      updateFields.push('assignee_id = ?')
      values.push(ticketData.assigneeId || null)
    }
    
    if (updateFields.length === 0) {
      return await getTicketById(id)
    }
    
    updateFields.push('updated_at = ?')
    values.push(new Date())
    values.push(id)
    
    const [result] = await connection.query(
      `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    ) as [any, any]
    
    if (result.affectedRows === 0) {
      return null
    }
    
    return await getTicketById(id)
  } catch (error) {
    console.error('Error updating ticket:', error)
    throw new Error('Failed to update ticket')
  } finally {
    connection.release()
  }
}

// Delete a ticket
export async function deleteTicket(id: string): Promise<boolean> {
  const connection = await getPool().getConnection()
  try {
    const [result] = await connection.query(
      'DELETE FROM tickets WHERE id = ?',
      [id]
    ) as [any, any]
    
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error deleting ticket:', error)
    throw new Error('Failed to delete ticket')
  } finally {
    connection.release()
  }
}

// Close database connection pool
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
