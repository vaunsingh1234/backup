// Test the frontend authentication with real API calls
const http = require('http');

async function testFrontendAuth() {
    console.log('🧪 Testing Frontend Authentication Flow...');
    
    // Test data
    const testUser = {
        name: 'Frontend Test User',
        email: 'frontend@test.com',
        phone: '+91 98765 43210',
        password: 'frontend123'
    };
    
    try {
        // Test 1: Signup
        console.log('\n📝 Testing Signup...');
        const signupResponse = await makeRequest('/api/auth/signup', 'POST', {
            name: testUser.name,
            email: testUser.email,
            phone: testUser.phone,
            password: testUser.password
        });
        console.log(`✅ Signup Status: ${signupResponse.status}`);
        console.log(`📄 Signup Response: ${JSON.stringify(signupResponse.data, null, 2)}`);
        
        if (signupResponse.status === 201) {
            // Test 2: Login with correct credentials
            console.log('\n🔐 Testing Login with correct credentials...');
            const loginResponse = await makeRequest('/api/auth/login', 'POST', {
                email: testUser.email,
                password: testUser.password
            });
            console.log(`✅ Login Status: ${loginResponse.status}`);
            console.log(`📄 Login Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
            
            // Test 3: Login with wrong password
            console.log('\n❌ Testing Login with wrong password...');
            const wrongLoginResponse = await makeRequest('/api/auth/login', 'POST', {
                email: testUser.email,
                password: 'wrongpassword'
            });
            console.log(`✅ Wrong Login Status: ${wrongLoginResponse.status}`);
            console.log(`📄 Wrong Login Response: ${JSON.stringify(wrongLoginResponse.data, null, 2)}`);
        }
        
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

testFrontendAuth();
