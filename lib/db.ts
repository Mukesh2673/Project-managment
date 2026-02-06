import { Ticket } from '@/types'
import mysql from 'mysql2/promise'

// Database connection pool
let pool: mysql.Pool | null = null

// Initialize database connection pool
export function getPool(): mysql.Pool {
  if (!pool) {
    const sslRequired = process.env.DB_SSL_MODE === 'REQUIRED' || process.env.DB_SSL === 'true'
    
    const poolConfig: mysql.PoolOptions = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'project_management',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
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

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  const connection = await getPool().getConnection()
  try {
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
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    connection.release()
  }
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
