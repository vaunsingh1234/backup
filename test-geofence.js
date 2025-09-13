const { Pool } = require('pg');

async function testGeoFence() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:test12345@localhost:5432/tourist_safety_db'
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Test creating a geo-fence
        const result = await client.query(`
            INSERT INTO geofences (name, description, latitude, longitude, radius, state, city, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            'Test Geo-fence',
            'Test geo-fence near Mumbai',
            19.0760,
            72.8777,
            1000,
            'Maharashtra',
            'Mumbai',
            true,
            'system'
        ]);
        
        console.log('✅ Geo-fence created:', result.rows[0]);
        
        // Test fetching geo-fences
        const fetchResult = await client.query(`
            SELECT * FROM geofences WHERE is_active = true
        `);
        
        console.log('✅ Geo-fences fetched:', fetchResult.rows.length, 'records');
        console.log('📋 Geo-fences:', fetchResult.rows.map(f => f.name));
        
        client.release();
        await pool.end();
        
        console.log('🎉 Geo-fence test complete!');
    } catch (error) {
        console.error('❌ Geo-fence test error:', error.message);
    }
}

testGeoFence();
