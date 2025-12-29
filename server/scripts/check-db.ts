import 'dotenv/config';
import { pool, db, checkDatabaseHealth } from '../db';

/**
 * Check database connection and display health information
 */
async function checkDatabase() {
  console.log('🔍 Checking database connection...\n');
  
  // Display configuration
  console.log('Configuration:');
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL || '(using default)'}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  // Check database health
  const health = await checkDatabaseHealth();
  
  console.log('Database Health:');
  console.log(`  Status: ${health.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`  Connected: ${health.details.connected ? 'Yes' : 'No'}`);
  
  if (health.details.connected) {
    console.log(`  Total Connections: ${health.details.totalConnections}`);
    console.log(`  Idle Connections: ${health.details.idleConnections}`);
    console.log(`  Waiting Clients: ${health.details.waitingClients}`);
  } else {
    console.log(`  Error: ${health.details.error}`);
  }
  
  console.log('');

  // Try to query database version
  if (pool && health.details.connected) {
    try {
      const client = await pool.connect();
      try {
        const versionResult = await client.query('SELECT version()');
        console.log('PostgreSQL Version:');
        console.log(`  ${versionResult.rows[0].version.split(',')[0]}`);
        console.log('');

        // Check for required extensions
        const extResult = await client.query(`
          SELECT extname, extversion 
          FROM pg_extension 
          WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm')
          ORDER BY extname
        `);
        
        console.log('Installed Extensions:');
        if (extResult.rows.length > 0) {
          extResult.rows.forEach(row => {
            console.log(`  ✅ ${row.extname} (${row.extversion})`);
          });
        } else {
          console.log('  ⚠️  No required extensions found');
        }
        console.log('');

        // Check for required tables
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);
        
        console.log(`Database Tables: (${tablesResult.rows.length} found)`);
        if (tablesResult.rows.length > 0) {
          const expectedTables = [
            'tenants', 'users', 'organizations', 'fleets',
            'vessels', 'voyages', 'ports', 'fuels', 'consumptions'
          ];
          
          expectedTables.forEach(tableName => {
            const exists = tablesResult.rows.some(row => row.table_name === tableName);
            console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
          });
          
          // List any additional tables
          const additionalTables = tablesResult.rows
            .map(row => row.table_name)
            .filter(name => !expectedTables.includes(name));
          
          if (additionalTables.length > 0) {
            console.log('  Additional tables:');
            additionalTables.forEach(name => {
              console.log(`    - ${name}`);
            });
          }
        } else {
          console.log('  ⚠️  No tables found - database needs to be initialized');
        }
        console.log('');

      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('❌ Error querying database:', error.message);
    }
  }

  // Summary and recommendations
  console.log('Summary:');
  if (health.details.connected) {
    console.log('  ✅ Database connection is working correctly');
    console.log('  ✅ Application can connect to PostgreSQL');
    
    // Check if schema is initialized
    if (pool) {
      try {
        const client = await pool.connect();
        const tableCheck = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tenants'
        `);
        client.release();
        
        if (tableCheck.rows[0].count === '0') {
          console.log('');
          console.log('  ⚠️  Database schema not initialized');
          console.log('  Run: npm run db:init');
        }
      } catch (error) {
        // Ignore error
      }
    }
  } else {
    console.log('  ❌ Cannot connect to database');
    console.log('');
    console.log('  Troubleshooting:');
    console.log('    1. Check if PostgreSQL is running');
    console.log('    2. Verify DATABASE_URL in .env file');
    console.log('    3. Ensure database "ghgconnect_db" exists');
    console.log('    4. Check username and password are correct');
    console.log('');
    console.log('  Create database if needed:');
    console.log('    psql -U postgres -c "CREATE DATABASE ghgconnect_db;"');
  }

  // Cleanup
  if (pool) {
    await pool.end();
  }
  
  process.exit(health.details.connected ? 0 : 1);
}

// Run the check
checkDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

