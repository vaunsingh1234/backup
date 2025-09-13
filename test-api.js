const http = require('http');

// Test API endpoints
async function testAPI() {
    console.log('🧪 Testing API endpoints...');
    
    const endpoints = [
        '/api/health',
        '/api/db/mongodb/status',
        '/api/db/mongodb/collections',
        '/api/db/mongodb/users'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔍 Testing: ${endpoint}`);
            
            const response = await makeRequest(endpoint);
            console.log(`✅ Status: ${response.status}`);
            console.log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

testAPI();
