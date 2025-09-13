// Test script to verify Travel ID update system
const { ethers } = require('ethers');

async function testUpdateSystem() {
    console.log('🧪 Testing Travel ID Update System...\n');
    
    const userEmail = 'aarushnalavade@gmail.com';
    
    // Check current blockchain Travel IDs
    console.log('📊 Current blockchain Travel IDs:');
    try {
        const currentResponse = await fetch('http://localhost:3001/api/db/blockchain-travel-ids');
        const currentIds = currentResponse.ok ? await currentResponse.json() : [];
        
        const userIds = currentIds.filter(id => id.userEmail === userEmail);
        console.log(`   Found ${userIds.length} Travel IDs for ${userEmail}:`);
        userIds.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id.travelId} (${id.status})`);
        });
    } catch (error) {
        console.log('   Error fetching current IDs:', error.message);
    }
    
    // Generate a new Travel ID
    console.log('\n🎫 Generating new Travel ID...');
    const userData = {
        name: 'Aarush Nalavade',
        email: userEmail,
        phone: '8828034567'
    };
    
    const userInfo = (userData.name || 'Traveler') + (userData.email || '') + (userData.phone || '');
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 15);
    const browserFingerprint = 'TestBrowser' + 'en-US' + '1920' + '1080';
    
    const base = userInfo + timestamp + randomSalt + browserFingerprint;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(base));
    const newTravelId = 'TRAVEL-' + hash.slice(2, 10).toUpperCase() + '-' + hash.slice(10, 18).toUpperCase();
    
    console.log(`   New Travel ID: ${newTravelId}`);
    
    // Store/Update the Travel ID
    try {
        const storeResponse = await fetch('http://localhost:3001/api/db/blockchain-travel-ids', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                travelId: newTravelId,
                userEmail: userEmail,
                generatedAt: new Date().toISOString()
            })
        });
        
        if (storeResponse.ok) {
            const result = await storeResponse.json();
            console.log(`✅ ${result.message} (Action: ${result.action})`);
        } else {
            const error = await storeResponse.text();
            console.log('❌ Failed to store/update Travel ID:', error);
            return;
        }
    } catch (error) {
        console.log('❌ Error storing/updating Travel ID:', error.message);
        return;
    }
    
    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check updated blockchain Travel IDs
    console.log('\n📊 Updated blockchain Travel IDs:');
    try {
        const updatedResponse = await fetch('http://localhost:3001/api/db/blockchain-travel-ids');
        const updatedIds = updatedResponse.ok ? await updatedResponse.json() : [];
        
        const userUpdatedIds = updatedIds.filter(id => id.userEmail === userEmail);
        console.log(`   Found ${userUpdatedIds.length} Travel IDs for ${userEmail}:`);
        userUpdatedIds.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id.travelId} (${id.status}) - ${id.generatedAt}`);
        });
        
        // Check if the new ID is the only one for this user
        if (userUpdatedIds.length === 1 && userUpdatedIds[0].travelId === newTravelId) {
            console.log('\n✅ SUCCESS: Old Travel IDs were replaced with the new one!');
        } else {
            console.log('\n❌ ISSUE: Multiple Travel IDs still exist for the same user');
        }
        
    } catch (error) {
        console.log('   Error fetching updated IDs:', error.message);
    }
    
    // Test verification
    console.log('\n🔍 Testing verification with new Travel ID:');
    try {
        const verifyResponse = await fetch(`http://localhost:3001/api/db/blockchain-travel-ids/verify/${newTravelId}`);
        const verifyResult = await verifyResponse.json();
        
        if (verifyResult.valid) {
            console.log('✅ Verification successful!');
            console.log(`   User: ${verifyResult.userEmail}`);
            console.log(`   Status: ${verifyResult.status}`);
        } else {
            console.log('❌ Verification failed:', verifyResult.error);
        }
    } catch (error) {
        console.log('❌ Error verifying Travel ID:', error.message);
    }
    
    console.log('\n🌐 Test verification page:');
    console.log(`   http://localhost:3001/verify.html?id=${newTravelId}`);
}

// Run the test
testUpdateSystem().catch(console.error);
