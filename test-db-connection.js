const { Pool } = require('pg');

async function testConnection() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:test12345@localhost:5432/postgres'
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Check if database exists
        const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'tourist_safety_db'");
        
        if (result.rows.length === 0) {
            console.log('📦 Creating database...');
            await client.query('CREATE DATABASE tourist_safety_db');
            console.log('✅ Database created');
        } else {
            console.log('✅ Database already exists');
        }
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

testConnection();
