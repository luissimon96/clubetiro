// Quick test script for connection pool implementation
// Run with: node test-connection-pool.js

import { exec } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing Connection Pool Implementation...\n');

// Test 1: Check if health endpoint works
console.log('📋 Test 1: Health Check Endpoint');
exec('curl -s http://localhost:3000/api/health', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Health endpoint not accessible (server may not be running)');
    console.log('   Run: npm run dev\n');
  } else {
    try {
      const response = JSON.parse(stdout);
      console.log('✅ Health endpoint working');
      console.log(`   Status: ${response.status}`);
      console.log(`   Database: ${response.services?.database?.status || 'unknown'}`);
      console.log(`   Pool connections: ${JSON.stringify(response.services?.database?.connectionPool || {})}\n`);
    } catch (e) {
      console.log('⚠️  Health endpoint returned non-JSON response');
      console.log(`   Response: ${stdout}\n`);
    }
  }
});

// Test 2: Check TypeScript compilation
console.log('📋 Test 2: TypeScript Compilation');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ TypeScript compilation errors:');
    console.log(`   ${stderr}\n`);
  } else {
    console.log('✅ TypeScript compilation successful\n');
  }
});

// Test 3: Check if imports are working
console.log('📋 Test 3: Database Pool Import Test');
try {
  // This will test if the import path works
  const databaseFile = fs.readFileSync('./utils/database.ts', 'utf8');
  
  if (databaseFile.includes('Pool') && databaseFile.includes('export')) {
    console.log('✅ Database pool utility file structure looks correct');
  } else {
    console.log('❌ Database pool utility file may have issues');
  }
  
  if (databaseFile.includes('healthCheck') && databaseFile.includes('getPoolStats')) {
    console.log('✅ Health check and monitoring functions present');
  } else {
    console.log('⚠️  Health check or monitoring functions may be missing');
  }
  
} catch (error) {
  console.log('❌ Could not read database utility file');
  console.log(`   Error: ${error.message}`);
}

console.log('\n🎯 Next Steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. Test health endpoint: curl http://localhost:3000/api/health');
console.log('3. Check database connection pool stats in the response');
console.log('4. Test login endpoint with the new pool: POST /api/auth/login');
console.log('\n📊 Success Criteria:');
console.log('- Health endpoint returns status: "ok"');
console.log('- Database service status: "healthy"');
console.log('- Connection pool stats showing totalCount, idleCount, etc.');
console.log('- No TypeScript compilation errors');
console.log('- Login/validation endpoints work without connection errors');