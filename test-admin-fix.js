// Test script to verify admin dashboard shows correct blockchain Travel IDs
async function testAdminDashboardFix() {
    console.log('🧪 Testing Admin Dashboard Fix...\n');
    
    try {
        // Fetch both regular users and blockchain Travel IDs
        const [usersResponse, blockchainIdsResponse] = await Promise.all([
            fetch('http://localhost:3001/api/db/mongodb/users'),
            fetch('http://localhost:3001/api/db/blockchain-travel-ids')
        ]);
        
        const users = usersResponse.ok ? await usersResponse.json() : [];
        const blockchainIds = blockchainIdsResponse.ok ? await blockchainIdsResponse.json() : [];
        
        console.log('📊 Data Summary:');
        console.log(`   Regular Users: ${users.length}`);
        console.log(`   Blockchain Travel IDs: ${blockchainIds.length}`);
        
        console.log('\n👥 Users with Blockchain Travel IDs:');
        users.forEach((user, index) => {
            // Find the blockchain Travel ID for this user
            const userBlockchainId = blockchainIds.find(id => id.userEmail === user.email);
            const blockchainId = userBlockchainId ? userBlockchainId.travelId : 'Not Generated';
            const status = userBlockchainId ? userBlockchainId.status : 'N/A';
            
            console.log(`   ${index + 1}. ${user.name} (${user.email})`);
            console.log(`      Old Digital ID: ${user.digitalId || 'N/A'}`);
            console.log(`      Blockchain Travel ID: ${blockchainId}`);
            console.log(`      Status: ${status === 'active' ? '✅ Active' : '❌ ' + status}`);
            console.log('');
        });
        
        console.log('🔗 All Blockchain Travel IDs:');
        blockchainIds.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id.travelId} - ${id.userEmail} (${id.status})`);
        });
        
        console.log('\n✅ Admin Dashboard should now show:');
        console.log('   - Correct blockchain Travel IDs instead of old digital IDs');
        console.log('   - Proper status (Active/Not Generated)');
        console.log('   - No more old TD-YYYY-MM-XXX format IDs');
        
        console.log('\n🌐 Test Admin Dashboard:');
        console.log('   http://localhost:3001/db-admin.html');
        console.log('   Click "👥 View Users" button in MongoDB section');
        
    } catch (error) {
        console.log('❌ Error testing admin dashboard:', error.message);
    }
}

// Run the test
testAdminDashboardFix().catch(console.error);
