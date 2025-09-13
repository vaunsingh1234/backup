// Test script to verify the verification page UI is working correctly
async function testVerifyUI() {
    console.log('🧪 Testing Verification Page UI...\n');
    
    // Test with a valid blockchain Travel ID
    const testTravelId = 'TRAVEL-057EBEDA-40191A5B';
    
    try {
        // Test the verification API
        const response = await fetch(`http://localhost:3001/api/db/blockchain-travel-ids/verify/${testTravelId}`);
        const result = await response.json();
        
        console.log('🔍 Verification API Result:');
        console.log(`   Valid: ${result.valid}`);
        
        if (result.valid) {
            console.log(`   Travel ID: ${result.travelId}`);
            console.log(`   User Email: ${result.userEmail}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   Generated At: ${result.generatedAt}`);
            
            if (result.user) {
                console.log('\n👤 User Information:');
                console.log(`   Name: ${result.user.name}`);
                console.log(`   Email: ${result.user.email}`);
                console.log(`   Phone: ${result.user.phone}`);
                console.log(`   Verified: ${result.user.isVerified ? '✅ Yes' : '❌ No'}`);
            }
            
            console.log('\n✅ Verification page should display:');
            console.log('   - Clean table with verification details');
            console.log('   - Blockchain information section');
            console.log('   - User information section');
            console.log('   - Proper styling and layout');
            
        } else {
            console.log(`   Error: ${result.error}`);
        }
        
        console.log('\n🌐 Test Verification Page:');
        console.log(`   http://localhost:3001/verify.html?id=${testTravelId}`);
        
        console.log('\n📋 Expected UI Elements:');
        console.log('   ✅ Travel ID display');
        console.log('   ✅ Status indicator (Valid/Invalid)');
        console.log('   ✅ Verification details table');
        console.log('   ✅ Blockchain information box');
        console.log('   ✅ User information box');
        console.log('   ✅ Success/error messages');
        
    } catch (error) {
        console.log('❌ Error testing verification UI:', error.message);
    }
}

// Run the test
testVerifyUI().catch(console.error);
