// Test script to verify admin dashboard shows blockchain Travel IDs
const { ethers } = require('ethers');

async function testAdminDashboard() {
    console.log('🧪 Testing Admin Dashboard Blockchain Travel ID Display...\n');
    
    // Generate a new Travel ID for testing
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+91 98765 43210'
    };
    
    const userInfo = (userData.name || 'Traveler') + (userData.email || '') + (userData.phone || '');
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 15);
    const browserFingerprint = 'TestBrowser' + 'en-US' + '1920' + '1080';
    
    const base = userInfo + timestamp + randomSalt + browserFingerprint;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(base));
    const travelId = 'TRAVEL-' + hash.slice(2, 10).toUpperCase() + '-' + hash.slice(10, 18).toUpperCase();
    
    console.log('🎫 Generated Test Travel ID:', travelId);
    
    // Store Travel ID in database
    try {
        const storeResponse = await fetch('http://localhost:3001/api/db/blockchain-travel-ids', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                travelId: travelId,
                userEmail: userData.email,
                generatedAt: new Date().toISOString()
            })
        });
        
        if (storeResponse.ok) {
            console.log('✅ Travel ID stored in database successfully');
        } else {
            const error = await storeResponse.text();
            console.log('❌ Failed to store Travel ID:', error);
            return;
        }
    } catch (error) {
        console.log('❌ Error storing Travel ID:', error.message);
        return;
    }
    
    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test the admin dashboard API endpoints
    console.log('\n🔍 Testing Admin Dashboard API Endpoints:');
    
    try {
        // Test MongoDB users endpoint
        const usersResponse = await fetch('http://localhost:3001/api/db/mongodb/users');
        const users = usersResponse.ok ? await usersResponse.json() : [];
        console.log(`📊 Regular Users: ${users.length} found`);
        
        // Test blockchain Travel IDs endpoint
        const blockchainResponse = await fetch('http://localhost:3001/api/db/blockchain-travel-ids');
        const blockchainIds = blockchainResponse.ok ? await blockchainResponse.json() : [];
        console.log(`🔗 Blockchain Travel IDs: ${blockchainIds.length} found`);
        
        if (blockchainIds.length > 0) {
            console.log('\n📋 Latest Blockchain Travel IDs:');
            blockchainIds.slice(0, 3).forEach((id, index) => {
                console.log(`${index + 1}. ${id.travelId} - ${id.userEmail} (${id.status})`);
            });
        }
        
        console.log('\n✅ Admin Dashboard should now show:');
        console.log(`   - ${users.length} regular users`);
        console.log(`   - ${blockchainIds.length} blockchain Travel IDs`);
        
        console.log('\n🌐 Access Admin Dashboard:');
        console.log('   http://localhost:3001/db-admin.html');
        console.log('   Click "👥 View Users" button in MongoDB section');
        
    } catch (error) {
        console.log('❌ Error testing admin dashboard:', error.message);
    }
}

// Run the test
testAdminDashboard().catch(console.error);
