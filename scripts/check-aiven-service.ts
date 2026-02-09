#!/usr/bin/env tsx
/**
 * Aiven Service Checker
 * 
 * This script helps diagnose Aiven MySQL connection issues
 */

import * as dns from 'dns'
import { promisify } from 'util'

const dnsLookup = promisify(dns.lookup)
const dnsResolve4 = promisify(dns.resolve4)

async function checkDNS(hostname: string) {
  console.log(`\n🔍 Checking DNS for: ${hostname}\n`)
  
  try {
    // Try standard lookup
    console.log('1. Standard DNS lookup...')
    const result = await dnsLookup(hostname)
    console.log(`   ✓ Resolved to: ${result.address}`)
    return result.address
  } catch (error: any) {
    console.log(`   ✗ Failed: ${error.message}`)
  }
  
  try {
    // Try resolve4
    console.log('2. IPv4 resolution...')
    const addresses = await dnsResolve4(hostname)
    console.log(`   ✓ Resolved to: ${addresses.join(', ')}`)
    return addresses[0]
  } catch (error: any) {
    console.log(`   ✗ Failed: ${error.message}`)
  }
  
  return null
}

async function main() {
  const hostname = process.env.DB_HOST || 'mysql-e367120-mukeshbhatt12344-02b2.j.aivencloud.com'
  
  console.log('📋 Aiven MySQL Service Diagnostic\n')
  console.log('Configuration:')
  console.log(`  Host: ${hostname}`)
  console.log(`  Port: ${process.env.DB_PORT || '15369'}`)
  console.log(`  User: ${process.env.DB_USER || 'avnadmin'}`)
  console.log(`  Database: ${process.env.DB_NAME || 'defaultdb'}`)
  
  const ip = await checkDNS(hostname)
  
  if (!ip) {
    console.log('\n❌ DNS Resolution Failed!\n')
    console.log('Possible causes:')
    console.log('  1. Aiven service is PAUSED')
    console.log('     → Go to Aiven dashboard and check service status')
    console.log('     → Resume the service if it\'s paused')
    console.log('')
    console.log('  2. Hostname has changed')
    console.log('     → Go to Aiven dashboard → Your MySQL service')
    console.log('     → Copy the new hostname from Connection information')
    console.log('     → Update DB_HOST in your .env file')
    console.log('')
    console.log('  3. DNS propagation delay')
    console.log('     → Wait a few minutes and try again')
    console.log('     → Try using a different DNS server (8.8.8.8)')
    console.log('')
    console.log('  4. Network connectivity issues')
    console.log('     → Check your internet connection')
    console.log('     → Try: ping google.com')
    console.log('')
    console.log('  5. Firewall/DNS blocking')
    console.log('     → Check if your network blocks DNS queries')
    console.log('     → Try using a VPN or different network')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Log into Aiven dashboard: https://console.aiven.io')
    console.log('  2. Navigate to your MySQL service')
    console.log('  3. Check the service status (should be RUNNING)')
    console.log('  4. Copy the exact hostname from Connection information')
    console.log('  5. Verify it matches your .env file')
    console.log('  6. If paused, click "Resume" to start the service')
  } else {
    console.log(`\n✅ DNS Resolution Successful!`)
    console.log(`   IP Address: ${ip}`)
    console.log('\nIf connection still fails, check:')
    console.log('  - Database credentials (DB_USER, DB_PASSWORD)')
    console.log('  - SSL configuration (DB_SSL_MODE=REQUIRED)')
    console.log('  - Firewall rules allow connections to port', process.env.DB_PORT || '15369')
  }
}

main().catch(console.error)
