const http = require('http');

// Test authentication system
async function testAuth() {
    console.log('🧪 Testing Authentication System...');
    
    // Test data
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+91 98765 43210',
        password: 'test123'
    };
    
    try {
        // Test 1: Signup
        console.log('\n📝 Testing Signup...');
        const signupResponse = await makeRequest('/api/auth/signup', 'POST', testUser);
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
            
            // Test 4: Login with non-existent user
            console.log('\n👤 Testing Login with non-existent user...');
            const nonExistentLoginResponse = await makeRequest('/api/auth/login', 'POST', {
                email: 'nonexistent@example.com',
                password: 'anypassword'
            });
            console.log(`✅ Non-existent Login Status: ${nonExistentLoginResponse.status}`);
            console.log(`📄 Non-existent Login Response: ${JSON.stringify(nonExistentLoginResponse.data, null, 2)}`);
            
            // Test 5: Try to signup with same email again
            console.log('\n🔄 Testing Duplicate Signup...');
            const duplicateSignupResponse = await makeRequest('/api/auth/signup', 'POST', testUser);
            console.log(`✅ Duplicate Signup Status: ${duplicateSignupResponse.status}`);
            console.log(`📄 Duplicate Signup Response: ${JSON.stringify(duplicateSignupResponse.data, null, 2)}`);
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

testAuth();
