import mysql from 'mysql2/promise'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

// Database connection pool (reuse from db.ts logic)
function getPool(): mysql.Pool {
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
    multipleStatements: true, // Allow multiple SQL statements
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

  return mysql.createPool(poolConfig)
}

// Create database if it doesn't exist
export async function createDatabaseIfNotExists(): Promise<void> {
  const dbName = process.env.DB_NAME || 'project_management'
  const pool = getPool()
  
  // Connect without specifying database
  const tempConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 1,
  }

  const sslRequired = process.env.DB_SSL_MODE === 'REQUIRED' || process.env.DB_SSL === 'true'
  if (sslRequired) {
    tempConfig.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    }
    if (process.env.DB_SSL_CA) {
      const fs = require('fs')
      tempConfig.ssl!.ca = fs.readFileSync(process.env.DB_SSL_CA)
    }
  }

  const tempPool = mysql.createPool(tempConfig)
  const connection = await tempPool.getConnection()
  
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`✓ Database '${dbName}' created or already exists`)
  } catch (error: any) {
    console.error('Error creating database:', error.message)
    throw error
  } finally {
    connection.release()
    await tempPool.end()
  }
}

// Initialize migrations table
async function initializeMigrationsTable(connection: mysql.PoolConnection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

// Check if migration has been executed
async function isMigrationExecuted(
  connection: mysql.PoolConnection,
  migrationName: string
): Promise<boolean> {
  const [rows] = await connection.query(
    'SELECT COUNT(*) as count FROM migrations WHERE name = ?',
    [migrationName]
  ) as [any[], any]
  
  return rows[0].count > 0
}

// Mark migration as executed
async function markMigrationExecuted(
  connection: mysql.PoolConnection,
  migrationName: string
): Promise<void> {
  await connection.query(
    'INSERT INTO migrations (name) VALUES (?)',
    [migrationName]
  )
}

// Get all migration files
async function getMigrationFiles(migrationsDir: string): Promise<string[]> {
  try {
    const files = await readdir(migrationsDir)
    return files
      .filter(file => file.endsWith('.sql'))
      .sort() // Execute in alphabetical order
  } catch (error) {
    console.error('Error reading migrations directory:', error)
    return []
  }
}

// Execute a single migration
async function executeMigration(
  connection: mysql.PoolConnection,
  migrationName: string,
  sql: string
): Promise<void> {
  console.log(`  Executing: ${migrationName}...`)
  
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement.length > 0) {
      await connection.query(statement)
    }
  }
  
  await markMigrationExecuted(connection, migrationName)
  console.log(`  ✓ Completed: ${migrationName}`)
}

// Run all pending migrations
export async function runMigrations(migrationsDir: string = './database/migrations'): Promise<void> {
  const pool = getPool()
  const connection = await pool.getConnection()
  
  try {
    console.log('🔄 Starting database migrations...\n')
    
    // Initialize migrations table
    await initializeMigrationsTable(connection)
    console.log('✓ Migrations table initialized\n')
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles(migrationsDir)
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.')
      return
    }
    
    console.log(`Found ${migrationFiles.length} migration file(s):\n`)
    
    let executedCount = 0
    let skippedCount = 0
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '')
      
      // Check if already executed
      if (await isMigrationExecuted(connection, migrationName)) {
        console.log(`  ⏭️  Skipped: ${migrationName} (already executed)`)
        skippedCount++
        continue
      }
      
      // Read and execute migration
      try {
        const filePath = join(migrationsDir, file)
        const sql = await readFile(filePath, 'utf-8')
        await executeMigration(connection, migrationName, sql)
        executedCount++
      } catch (error: any) {
        console.error(`  ✗ Error executing ${migrationName}:`, error.message)
        throw error
      }
    }
    
    console.log(`\n✅ Migrations completed!`)
    console.log(`   Executed: ${executedCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    
  } catch (error: any) {
    console.error('\n✗ Migration failed:', error.message)
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

// Rollback last migration (optional - for future use)
export async function rollbackLastMigration(migrationsDir: string = './database/migrations'): Promise<void> {
  const pool = getPool()
  const connection = await pool.getConnection()
  
  try {
    // Get the last executed migration
    const [rows] = await connection.query(
      'SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1'
    ) as [any[], any]
    
    if (rows.length === 0) {
      console.log('No migrations to rollback.')
      return
    }
    
    const migrationName = rows[0].name
    console.log(`Rolling back: ${migrationName}`)
    
    // Note: This is a basic implementation
    // For full rollback support, you'd need rollback SQL in migration files
    await connection.query('DELETE FROM migrations WHERE name = ?', [migrationName])
    console.log(`✓ Rolled back: ${migrationName}`)
    
  } catch (error: any) {
    console.error('Rollback failed:', error.message)
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}
