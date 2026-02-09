#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and provides
 * helpful error messages if connection fails.
 */

import { testConnection } from '../lib/db'
import * as dns from 'dns'
import { promisify } from 'util'

const dnsLookup = promisify(dns.lookup)

async function testDNSResolution(hostname: string): Promise<boolean> {
  try {
    const result = await dnsLookup(hostname)
    console.log(`✓ DNS Resolution successful: ${hostname} -> ${result.address}`)
    return true
  } catch (error: any) {
    console.error(`✗ DNS Resolution failed for ${hostname}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔍 Database Connection Test\n')
  console.log('Environment Variables:')
  console.log(`  DB_HOST: ${process.env.DB_HOST || '(not set)'}`)
  console.log(`  DB_PORT: ${process.env.DB_PORT || '(not set)'}`)
  console.log(`  DB_USER: ${process.env.DB_USER || '(not set)'}`)
  console.log(`  DB_NAME: ${process.env.DB_NAME || '(not set)'}`)
  console.log(`  DB_SSL: ${process.env.DB_SSL || 'false'}`)
  console.log(`  DB_SSL_MODE: ${process.env.DB_SSL_MODE || '(not set)'}\n`)

  const host = process.env.DB_HOST
  if (!host) {
    console.error('✗ DB_HOST environment variable is not set!')
    console.error('  Please set DB_HOST in your .env file')
    process.exit(1)
  }

  // Test DNS resolution first
  console.log('1. Testing DNS Resolution...')
  const dnsSuccess = await testDNSResolution(host)
  
  if (!dnsSuccess) {
    console.error('\n❌ DNS Resolution Failed!')
    console.error('\nTroubleshooting steps:')
    console.error('  1. Verify the DB_HOST is correct in your .env file')
    console.error('  2. Check if your Aiven service is active:')
    console.error('     - Log into Aiven dashboard')
    console.error('     - Check if the MySQL service is running')
    console.error('     - Verify the hostname hasn\'t changed')
    console.error('  3. Test DNS resolution manually:')
    console.error(`     nslookup ${host}`)
    console.error('  4. Check your network connection')
    console.error('  5. If using Aiven, ensure the service is not paused')
    process.exit(1)
  }

  // Test database connection
  console.log('\n2. Testing Database Connection...')
  const result = await testConnection()
  
  if (result.success) {
    console.log(`\n✅ ${result.message}`)
    process.exit(0)
  } else {
    console.error(`\n❌ ${result.message}`)
    console.error('\nTroubleshooting steps:')
    console.error('  1. Verify all database credentials in .env:')
    console.error('     - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME')
    console.error('  2. For Aiven MySQL:')
    console.error('     - Ensure DB_SSL_MODE=REQUIRED')
    console.error('     - Ensure DB_SSL=true')
    console.error('     - Set DB_SSL_REJECT_UNAUTHORIZED=false')
    console.error('  3. Check firewall rules allow connections')
    console.error('  4. Verify the database user has proper permissions')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
