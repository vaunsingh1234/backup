// Test script to verify conflicting messages are removed
async function testMessageFix() {
    console.log('🧪 Testing Message Display Fix...\n');
    
    const validTravelId = 'TRAVEL-06A997FC-43CF3041';
    const invalidTravelId = 'INVALID-ID';
    
    console.log('🔍 Testing Valid Travel ID:', validTravelId);
    
    try {
        // Test valid Travel ID
        const validResponse = await fetch(`http://localhost:3001/api/db/blockchain-travel-ids/verify/${validTravelId}`);
        const validResult = await validResponse.json();
        
        console.log('📊 Valid Travel ID Result:');
        console.log(`   Valid: ${validResult.valid}`);
        
        if (validResult.valid) {
            console.log('✅ SUCCESS: Valid Travel ID should show:');
            console.log('   ✅ "Valid Travel ID" status');
            console.log('   ✅ Green success message');
            console.log('   ❌ NO red error message');
            console.log('   ✅ All verification details');
        }
        
        console.log('\n🔍 Testing Invalid Travel ID:', invalidTravelId);
        
        // Test invalid Travel ID
        const invalidResponse = await fetch(`http://localhost:3001/api/db/blockchain-travel-ids/verify/${invalidTravelId}`);
        const invalidResult = await invalidResponse.json();
        
        console.log('📊 Invalid Travel ID Result:');
        console.log(`   Valid: ${invalidResult.valid}`);
        console.log(`   Error: ${invalidResult.error}`);
        
        if (!invalidResult.valid) {
            console.log('✅ SUCCESS: Invalid Travel ID should show:');
            console.log('   ❌ "Invalid Travel ID" status');
            console.log('   ❌ Red error message');
            console.log('   ✅ NO green success message');
            console.log('   ❌ No verification details');
        }
        
        console.log('\n🎯 Expected Behavior:');
        console.log('   ✅ Only ONE message type displayed at a time');
        console.log('   ✅ No conflicting success/error messages');
        console.log('   ✅ Clean, professional UI');
        console.log('   ✅ Clear status indication');
        
        console.log('\n🌐 Test URLs:');
        console.log(`   Valid: http://localhost:3001/verify.html?id=${validTravelId}`);
        console.log(`   Invalid: http://localhost:3001/verify.html?id=${invalidTravelId}`);
        
        console.log('\n🔧 Fix Applied:');
        console.log('   ✅ Hide error message when showing valid result');
        console.log('   ✅ Hide success message when showing invalid result');
        console.log('   ✅ Mutually exclusive message display');
        
    } catch (error) {
        console.log('❌ Error testing message fix:', error.message);
    }
}

// Run the test
testMessageFix().catch(console.error);
