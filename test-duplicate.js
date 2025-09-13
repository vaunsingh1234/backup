// Test duplicate signup
const http = require('http');

async function testDuplicateSignup() {
    console.log('🧪 Testing Duplicate Signup...');
    
    try {
        // Try to signup with existing email
        const signupResponse = await makeRequest('/api/auth/signup', 'POST', {
            name: 'Duplicate Test',
            email: 'test@example.com', // This email already exists
            phone: '+91 98765 43210',
            password: 'test123'
        });
        
        console.log(`✅ Signup Status: ${signupResponse.status}`);
        console.log(`📄 Signup Response: ${JSON.stringify(signupResponse.data, null, 2)}`);
        
        // Try to login with the existing user
        console.log('\n🔐 Testing Login with existing user...');
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'test123'
        });
        
        console.log(`✅ Login Status: ${loginResponse.status}`);
        console.log(`📄 Login Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData
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
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

testDuplicateSignup();
