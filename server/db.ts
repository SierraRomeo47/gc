import 'dotenv/config';
import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Database URL: Must be provided via environment variable
// When running in Docker, DATABASE_URL will point to the postgres container
// When running locally, it will point to localhost
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL not set.');
  console.error('   Set DATABASE_URL in your .env file or environment variables.');
  console.error('   See .env.template for examples.');
  process.exit(1);
}

// Production-grade pool configuration
const poolConfig: PoolConfig = {
  connectionString: DATABASE_URL,
  
  // Connection pool settings
  max: NODE_ENV === 'production' ? 20 : 10, // Maximum pool size
  min: 2, // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout for new connections
  
  // Query timeout
  query_timeout: 30000, // 30 seconds for queries
  statement_timeout: 30000, // 30 seconds for statements
  
  // SSL for production
  ssl: NODE_ENV === 'production' ? {
    rejectUnauthorized: true, // Verify SSL certificates in production
  } : false,
  
  // Application name for monitoring
  application_name: 'ghgconnect_app',
};

// Create pool with error handling and retry logic
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function initializeDatabase(retryCount = 0): Promise<void> {
  try {
    connectionAttempts++;
    console.log(`[${connectionAttempts}] Initializing database connection...`);
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Database: ${process.env.POSTGRES_DB || 'not specified'}`);
    
    // Production safety warning
    if (NODE_ENV === 'production') {
      console.warn('\n⚠️  ========================================');
      console.warn('⚠️  PRODUCTION DATABASE CONNECTION');
      console.warn('⚠️  ========================================');
      console.warn(`⚠️  Database: ${process.env.POSTGRES_DB}`);
      console.warn('⚠️  All operations will affect LIVE data!');
      console.warn('⚠️  ========================================\n');
      
      // Check for weak passwords in production
      const weakPasswords = ['password', '123456', 'admin', 'test', 'ghgconnect_dev_password_2024'];
      const currentPassword = process.env.POSTGRES_PASSWORD || '';
      if (weakPasswords.some(weak => currentPassword.includes(weak))) {
        console.error('\n❌ ERROR: WEAK PASSWORD DETECTED IN PRODUCTION!');
        console.error('❌ Please update POSTGRES_PASSWORD in your .env file');
        console.error('❌ Generate a strong password with: openssl rand -base64 32\n');
        throw new Error('Weak password detected in production environment');
      }
    }
    
    pool = new Pool(poolConfig);

    // Set up error handlers
    pool.on('error', (err, client) => {
      console.error('Unexpected database pool error:', err);
      console.error('Client:', client);
    });

    pool.on('connect', (client) => {
      console.log('New database connection established');
      // Set session-level configurations
      client.query(`
        SET timezone = 'UTC';
        SET statement_timeout = 30000;
        SET lock_timeout = 10000;
      `).catch(err => console.error('Error setting session config:', err));
    });

    pool.on('acquire', () => {
      // console.log('Connection acquired from pool');
    });

    pool.on('remove', () => {
      console.log('Connection removed from pool');
    });

    // Test the connection with a simple query
    const testClient = await pool.connect();
    try {
      const result = await testClient.query('SELECT NOW(), current_database(), current_user');
      console.log('✅ Database connection successful!');
      console.log(`   Database: ${result.rows[0].current_database}`);
      console.log(`   User: ${result.rows[0].current_user}`);
      console.log(`   Time: ${result.rows[0].now}`);
      console.log(`   Environment: ${NODE_ENV}`);
      
      // Check if required extensions are installed
      const extensions = await testClient.query(`
        SELECT extname FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm')
      `);
      console.log(`   Extensions: ${extensions.rows.map(r => r.extname).join(', ')}`);
      
      // Additional warning for production
      if (NODE_ENV === 'production' && result.rows[0].current_database.includes('dev')) {
        console.warn('\n⚠️  WARNING: Production mode connected to database with "dev" in name!');
        console.warn('⚠️  Verify you are using the correct database.\n');
      }
      
    } finally {
      testClient.release();
    }

    // Initialize Drizzle ORM
    db = drizzle(pool, { schema, logger: NODE_ENV === 'development' });
    console.log('✅ Drizzle ORM initialized');
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    
    // Retry logic for transient failures
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return initializeDatabase(retryCount + 1);
    }
    
    console.error('❌ Max retry attempts reached. Database connection failed.');
    console.error('   Start PostgreSQL with: docker-compose up -d');
    process.exit(1);
  }
}

// Initialize on module load
initializeDatabase().catch(err => {
  console.error('Fatal database initialization error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing database connections');
  if (pool) {
    await pool.end();
    console.log('Database pool has ended');
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing database connections');
  if (pool) {
    await pool.end();
    console.log('Database pool has ended');
  }
  process.exit(0);
});

// Health check function
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  details: {
    connected: boolean;
    totalConnections?: number;
    idleConnections?: number;
    waitingClients?: number;
    error?: string;
  };
}> {
  if (!pool) {
    return {
      healthy: false,
      details: {
        connected: false,
        error: 'Database not initialized'
      }
    };
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return {
        healthy: true,
        details: {
          connected: true,
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingClients: pool.waitingCount,
        }
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    return {
      healthy: false,
      details: {
        connected: false,
        error: `Database unavailable: ${error.message}`
      }
    };
  }
}

export { pool, db };
