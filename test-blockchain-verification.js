// Test script to generate and verify blockchain Travel ID for aarushnalavade@gmail.com
const { ethers } = require('ethers');

async function testBlockchainVerification() {
    console.log('🧪 Testing Blockchain Travel ID Generation and Verification...\n');
    
    // Simulate user data for aarushnalavade@gmail.com
    const userData = {
        name: 'Aarush Nalavade',
        email: 'aarushnalavade@gmail.com',
        phone: '8828034567'
    };
    
    // Generate Travel ID using the same logic as frontend
    const userInfo = (userData.name || 'Traveler') + (userData.email || '') + (userData.phone || '');
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 15);
    const browserFingerprint = 'TestBrowser' + 'en-US' + '1920' + '1080';
    
    const base = userInfo + timestamp + randomSalt + browserFingerprint;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(base));
    const travelId = 'TRAVEL-' + hash.slice(2, 10).toUpperCase() + '-' + hash.slice(10, 18).toUpperCase();
    
    console.log('👤 User:', userData.name);
    console.log('📧 Email:', userData.email);
    console.log('🎫 Generated Travel ID:', travelId);
    
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
    
    // Test verification
    try {
        const verifyResponse = await fetch(`http://localhost:3001/api/db/blockchain-travel-ids/verify/${travelId}`);
        const result = await verifyResponse.json();
        
        console.log('\n🔍 Verification Result:');
        console.log('Valid:', result.valid);
        
        if (result.valid) {
            console.log('✅ Travel ID is valid!');
            console.log('📧 User Email:', result.userEmail);
            console.log('📅 Generated At:', result.generatedAt);
            console.log('📊 Status:', result.status);
            
            if (result.user) {
                console.log('\n👤 User Information:');
                console.log('Name:', result.user.name);
                console.log('Email:', result.user.email);
                console.log('Phone:', result.user.phone);
                console.log('Verified:', result.user.isVerified ? '✅ Yes' : '❌ No');
            }
        } else {
            console.log('❌ Travel ID is invalid:', result.error);
        }
        
    } catch (error) {
        console.log('❌ Error verifying Travel ID:', error.message);
    }
    
    console.log('\n🎯 Test URL for verification page:');
    console.log(`http://localhost:3001/verify.html?id=${travelId}`);
}

// Run the test
testBlockchainVerification().catch(console.error);
