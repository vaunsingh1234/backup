// Script to clean up duplicate blockchain Travel IDs
const { MongoClient } = require('mongodb');

async function cleanupDuplicates() {
    console.log('🧹 Cleaning up duplicate blockchain Travel IDs...\n');
    
    const client = new MongoClient('mongodb://admin:password123@localhost:27018/tourist_safety_mongo?authSource=admin');
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('tourist_safety_mongo');
        const collection = db.collection('blockchain_travel_ids');
        
        // Get all Travel IDs grouped by user email
        const allIds = await collection.find({}).toArray();
        console.log(`📊 Total Travel IDs: ${allIds.length}`);
        
        // Group by user email
        const groupedByEmail = {};
        allIds.forEach(id => {
            if (!groupedByEmail[id.userEmail]) {
                groupedByEmail[id.userEmail] = [];
            }
            groupedByEmail[id.userEmail].push(id);
        });
        
        console.log(`👥 Users with Travel IDs: ${Object.keys(groupedByEmail).length}`);
        
        // Process each user
        for (const [email, ids] of Object.entries(groupedByEmail)) {
            if (ids.length > 1) {
                console.log(`\n🔄 Processing ${email} (${ids.length} Travel IDs):`);
                
                // Sort by creation date (newest first)
                ids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                // Keep the newest one, delete the rest
                const keepId = ids[0];
                const deleteIds = ids.slice(1);
                
                console.log(`   ✅ Keeping: ${keepId.travelId} (${keepId.createdAt})`);
                
                for (const deleteId of deleteIds) {
                    console.log(`   🗑️ Deleting: ${deleteId.travelId} (${deleteId.createdAt})`);
                    await collection.deleteOne({ _id: deleteId._id });
                }
            } else {
                console.log(`✅ ${email}: 1 Travel ID (no cleanup needed)`);
            }
        }
        
        // Verify cleanup
        const finalCount = await collection.countDocuments();
        console.log(`\n📊 Final Travel ID count: ${finalCount}`);
        
        // Show final state
        const finalIds = await collection.find({}).sort({ createdAt: -1 }).toArray();
        console.log('\n📋 Final Travel IDs:');
        finalIds.forEach((id, index) => {
            console.log(`   ${index + 1}. ${id.travelId} - ${id.userEmail} (${id.createdAt})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Cleanup completed');
    }
}

// Run cleanup
cleanupDuplicates().catch(console.error);
