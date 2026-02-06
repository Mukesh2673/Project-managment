#!/usr/bin/env node

import { createDatabaseIfNotExists, runMigrations } from '../lib/migrate'
import { resolve, join } from 'path'

async function main() {
  const command = process.argv[2]
  const migrationsDir = resolve(process.cwd(), 'database', 'migrations')
  
  try {
    // Default to 'up' if no command provided
    const cmd = command || 'up'
    
    switch (cmd) {
      case 'up':
      case 'migrate':
        console.log('📦 Creating database if it doesn\'t exist...\n')
        await createDatabaseIfNotExists()
        console.log('')
        await runMigrations(migrationsDir)
        break
        
      case 'create-db':
        await createDatabaseIfNotExists()
        break
        
      default:
        console.log('Usage: npm run migrate [command]')
        console.log('')
        console.log('Commands:')
        console.log('  up, migrate    Run all pending migrations (default)')
        console.log('  create-db      Create database if it doesn\'t exist')
        console.log('')
        process.exit(1)
    }
    
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main()
