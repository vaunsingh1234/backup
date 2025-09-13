const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:test12345@localhost:5432/tourist_safety_db'
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Read and execute the migration file
        const migrationPath = path.join(__dirname, 'backend', 'migrations', '002_create_complete_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📦 Running database migrations...');
        await client.query(migrationSQL);
        console.log('✅ Database tables created successfully');
        
        client.release();
        await pool.end();
        
        console.log('🎉 Database setup complete!');
    } catch (error) {
        console.error('❌ Database setup error:', error.message);
    }
}

setupDatabase();