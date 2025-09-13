const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabaseFinal() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:test12345@localhost:5432/tourist_safety_db'
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Drop existing tables if they exist to avoid constraint conflicts
        console.log('🧹 Cleaning existing tables...');
        const dropTables = [
            'DROP TABLE IF EXISTS geofence_violations CASCADE;',
            'DROP TABLE IF EXISTS evidence CASCADE;',
            'DROP TABLE IF EXISTS incidents CASCADE;',
            'DROP TABLE IF EXISTS emergencies CASCADE;',
            'DROP TABLE IF EXISTS users CASCADE;',
            'DROP TABLE IF EXISTS geofences CASCADE;',
            'DROP TABLE IF EXISTS police_officers CASCADE;'
        ];
        
        for (const dropQuery of dropTables) {
            try {
                await client.query(dropQuery);
            } catch (error) {
                console.log(`⚠️  Warning: ${error.message}`);
            }
        }
        
        // Run first migration (geofences)
        console.log('📦 Running geofences migration...');
        const geofencesMigrationPath = path.join(__dirname, 'backend', 'migrations', '001_create_geofences_table.sql');
        const geofencesSQL = fs.readFileSync(geofencesMigrationPath, 'utf8');
        await client.query(geofencesSQL);
        console.log('✅ Geofences tables created successfully');
        
        // Run second migration (complete schema)
        console.log('📦 Running complete schema migration...');
        const completeMigrationPath = path.join(__dirname, 'backend', 'migrations', '002_create_complete_schema.sql');
        const completeSQL = fs.readFileSync(completeMigrationPath, 'utf8');
        await client.query(completeSQL);
        console.log('✅ Complete schema created successfully');
        
        client.release();
        await pool.end();
        
        console.log('🎉 Database setup complete!');
    } catch (error) {
        console.error('❌ Database setup error:', error.message);
    }
}

setupDatabaseFinal();