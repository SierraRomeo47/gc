import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../db';

/**
 * Initialize the database schema using the complete_database_build.sql script
 */
async function initializeDatabase() {
  console.log('🚀 Initializing database schema...\n');
  
  if (!pool) {
    console.error('❌ Error: Database connection not available');
    console.error('   Check your DATABASE_URL in .env file');
    process.exit(1);
  }

  try {
    // Read the SQL script
    const sqlFilePath = join(process.cwd(), 'database', 'complete_database_build.sql');
    console.log(`📄 Reading SQL script: ${sqlFilePath}`);
    
    const sqlScript = readFileSync(sqlFilePath, 'utf-8');
    console.log(`   Script size: ${(sqlScript.length / 1024).toFixed(2)} KB`);
    console.log('');

    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    try {
      // Execute the SQL script
      console.log('⚙️  Executing SQL script...');
      console.log('   This may take a few moments...');
      console.log('');
      
      await client.query(sqlScript);
      
      console.log('✅ Database schema initialized successfully!');
      console.log('');

      // Verify tables were created
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      console.log(`📊 Created ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
      console.log('');

      // Check sample data
      const tenantCount = await client.query('SELECT COUNT(*) FROM tenants');
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      const vesselCount = await client.query('SELECT COUNT(*) FROM vessels');
      const portCount = await client.query('SELECT COUNT(*) FROM ports');
      const fuelCount = await client.query('SELECT COUNT(*) FROM fuels');
      
      console.log('📦 Sample data loaded:');
      console.log(`   Tenants: ${tenantCount.rows[0].count}`);
      console.log(`   Users: ${userCount.rows[0].count}`);
      console.log(`   Vessels: ${vesselCount.rows[0].count}`);
      console.log(`   Ports: ${portCount.rows[0].count}`);
      console.log(`   Fuels: ${fuelCount.rows[0].count}`);
      console.log('');

      // Display login credentials
      console.log('🔑 Login Credentials:');
      console.log('   Admin:');
      console.log('     Email: admin@maritime-solutions.com');
      console.log('     Password: admin123');
      console.log('');
      console.log('   Compliance:');
      console.log('     Email: compliance@maritime-solutions.com');
      console.log('     Password: compliance123');
      console.log('');

      console.log('✨ Database initialization complete!');
      console.log('   You can now start the application with: npm run dev');
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('❌ Error initializing database:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ENOENT') {
      console.error('');
      console.error('   SQL script not found. Expected location:');
      console.error('   database/complete_database_build.sql');
    } else if (error.code === '42P04') {
      console.error('');
      console.error('   Database already exists. This is usually fine.');
      console.error('   To reinitialize, drop the database first:');
      console.error('   psql -U postgres -c "DROP DATABASE ghgconnect_db;"');
      console.error('   psql -U postgres -c "CREATE DATABASE ghgconnect_db;"');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the initialization
initializeDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

