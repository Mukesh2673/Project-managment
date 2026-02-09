#!/usr/bin/env node

/**
 * Post-build script for Render.com deployment
 * Runs database migrations after build completes
 */

import { createDatabaseIfNotExists, runMigrations } from '../lib/migrate'
import { resolve } from 'path'

async function main() {
  try {
    console.log('🔄 Running post-build migrations...\n')
    
    // Create database if it doesn't exist
    await createDatabaseIfNotExists()
    console.log('')
    
    // Run migrations
    const migrationsDir = resolve(process.cwd(), 'database', 'migrations')
    await runMigrations(migrationsDir)
    
    console.log('\n✅ Post-build migrations completed successfully!')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Post-build migration failed:', error.message)
    // Don't fail the build if migrations fail - they can be run manually
    console.log('⚠️  Continuing deployment. Run migrations manually if needed.')
    process.exit(0) // Exit with 0 to not fail the build
  }
}

main()
