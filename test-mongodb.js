const mongoose = require('mongoose');

// Test MongoDB connection and create sample data
async function testMongoDB() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        
        // Connect to MongoDB
        const mongoUrl = 'mongodb://admin:password123@localhost:27018/tourist_safety_mongo?authSource=admin';
        await mongoose.connect(mongoUrl);
        console.log('✅ Connected to MongoDB');
        
        // Create a simple schema
        const userSchema = new mongoose.Schema({
            name: String,
            email: String,
            location: String,
            createdAt: { type: Date, default: Date.now }
        });
        
        const User = mongoose.model('User', userSchema);
        
        // Create sample data
        console.log('📝 Creating sample data...');
        
        const sampleUsers = [
            {
                name: 'Sandra Glam',
                email: 'sandra@email.com',
                location: 'Mumbai, Maharashtra'
            },
            {
                name: 'Raj Patel',
                email: 'raj@email.com',
                location: 'Delhi, Delhi'
            },
            {
                name: 'Priya Sharma',
                email: 'priya@email.com',
                location: 'Bangalore, Karnataka'
            }
        ];
        
        // Clear existing users and insert new ones
        await User.deleteMany({});
        await User.insertMany(sampleUsers);
        
        console.log('✅ Sample data created successfully');
        
        // Query and display data
        const users = await User.find({});
        console.log('📊 Current users in database:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.location}`);
        });
        
        // Create geofence data
        const geofenceSchema = new mongoose.Schema({
            name: String,
            description: String,
            latitude: Number,
            longitude: Number,
            radius: Number,
            active: Boolean,
            state: String,
            createdAt: { type: Date, default: Date.now }
        });
        
        const Geofence = mongoose.model('Geofence', geofenceSchema);
        
        const sampleGeofences = [
            {
                name: 'Restricted Area - Mumbai',
                description: 'High security zone',
                latitude: 19.0760,
                longitude: 72.8777,
                radius: 100,
                active: true,
                state: 'Maharashtra'
            },
            {
                name: 'Tourist Zone - Delhi',
                description: 'Safe tourist area',
                latitude: 28.7041,
                longitude: 77.1025,
                radius: 200,
                active: true,
                state: 'Delhi'
            }
        ];
        
        await Geofence.deleteMany({});
        await Geofence.insertMany(sampleGeofences);
        
        console.log('✅ Sample geofences created successfully');
        
        const geofences = await Geofence.find({});
        console.log('📊 Current geofences in database:');
        geofences.forEach((geofence, index) => {
            console.log(`${index + 1}. ${geofence.name} - ${geofence.state} (${geofence.active ? 'Active' : 'Inactive'})`);
        });
        
        console.log('🎉 MongoDB test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testMongoDB();
