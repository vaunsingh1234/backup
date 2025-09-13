// Test script to verify unique Travel ID generation
const { ethers } = require('ethers');

function generateTravelID(userData) {
    // Simulate the same logic as the frontend
    const userInfo = (userData.name || 'Traveler') + (userData.email || '') + (userData.phone || '');
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 15);
    const browserFingerprint = 'TestBrowser' + 'en-US' + '1920' + '1080';
    
    const base = userInfo + timestamp + randomSalt + browserFingerprint;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(base));
    const travelId = 'TRAVEL-' + hash.slice(2, 10).toUpperCase() + '-' + hash.slice(10, 18).toUpperCase();
    
    return travelId;
}

console.log('🧪 Testing unique Travel ID generation...\n');

// Test with different users
const users = [
    { name: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210' },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '+91 87654 32109' },
    { name: 'Bob Johnson', email: 'bob@example.com', phone: '+91 76543 21098' },
    { name: 'Alice Brown', email: 'alice@example.com', phone: '+91 65432 10987' },
    { name: 'Charlie Wilson', email: 'charlie@example.com', phone: '+91 54321 09876' }
];

const generatedIds = new Set();

users.forEach((user, index) => {
    console.log(`👤 User ${index + 1}: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📱 Phone: ${user.phone}`);
    
    // Generate multiple IDs for the same user to test uniqueness
    const ids = [];
    for (let i = 0; i < 3; i++) {
        const id = generateTravelID(user);
        ids.push(id);
        generatedIds.add(id);
    }
    
    console.log(`🎫 Generated IDs:`);
    ids.forEach((id, i) => {
        console.log(`   ${i + 1}. ${id}`);
    });
    console.log('');
});

console.log(`📊 Total unique IDs generated: ${generatedIds.size}`);
console.log(`📊 Expected unique IDs: ${users.length * 3}`);
console.log(`✅ All IDs are unique: ${generatedIds.size === users.length * 3 ? 'YES' : 'NO'}`);

if (generatedIds.size === users.length * 3) {
    console.log('\n🎉 SUCCESS: Travel ID generation is working correctly!');
    console.log('Each user gets unique IDs even with multiple generations.');
} else {
    console.log('\n❌ ISSUE: Some IDs are not unique. Check the generation logic.');
}
