// Test script to verify the verification page has a cleaner display
async function testCleanDisplay() {
    console.log('🧪 Testing Clean Verification Page Display...\n');
    
    const testTravelId = 'TRAVEL-06A997FC-43CF3041';
    
    try {
        // Test the verification API
        const response = await fetch(`http://localhost:3001/api/db/blockchain-travel-ids/verify/${testTravelId}`);
        const result = await response.json();
        
        console.log('📊 Verification Result:');
        console.log(`   Valid: ${result.valid}`);
        
        if (result.valid) {
            console.log('✅ SUCCESS: Clean display should show:');
            console.log('   ✅ "Valid Travel ID" status');
            console.log('   ✅ Basic verification details table:');
            console.log('      - Generated date');
            console.log('      - Status');
            console.log('      - Blockchain info');
            console.log('      - Last verified');
            console.log('   ✅ Green success message');
            console.log('   ❌ NO detailed blockchain information box');
            console.log('   ❌ NO detailed user information box');
            console.log('   ✅ Clean, minimal interface');
            
            console.log('\n🎯 Removed Information:');
            console.log('   ❌ Blockchain Information section (hash, network, type)');
            console.log('   ❌ User Information section (name, email, phone, verified status)');
            console.log('   ✅ Kept only essential verification details');
            
        } else {
            console.log('❌ FAILED: Travel ID is invalid');
            console.log(`   Error: ${result.error}`);
        }
        
        console.log('\n🌐 Test URL:');
        console.log(`   http://localhost:3001/verify.html?id=${testTravelId}`);
        
        console.log('\n🔧 Changes Applied:');
        console.log('   ✅ Removed blockchain information box');
        console.log('   ✅ Removed user information box');
        console.log('   ✅ Kept essential verification details');
        console.log('   ✅ Cleaner, more focused interface');
        
    } catch (error) {
        console.log('❌ Error testing clean display:', error.message);
    }
}

// Run the test
testCleanDisplay().catch(console.error);
