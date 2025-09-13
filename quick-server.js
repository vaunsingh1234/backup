const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Simple MongoDB connection
async function connectMongoDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tourist_safety_mongo');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('⚠️  Continuing without MongoDB...');
    }
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Simple auth endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Simple mock authentication
        if (email === 'test@example.com' && password === 'password') {
            res.json({
                success: true,
                message: 'Login successful',
                token: 'mock_token_' + Date.now(),
                user: {
                    id: 'TD-2024-01-001',
                    name: 'Test User',
                    email: email,
                    phone: '+1234567890',
                    digitalId: 'TD-2024-01-001',
                    idType: 'passport',
                    location: 'Mumbai, Maharashtra',
                    joinedDate: new Date().toISOString().split('T')[0],
                    safetyScore: 80,
                    isVerified: true
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        const digitalId = `TD-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.random().toString().substr(2, 3)}`;
        
        res.status(201).json({
            success: true,
            message: 'Digital Tourist ID created successfully',
            token: 'mock_token_' + Date.now(),
            user: {
                id: digitalId,
                name: name,
                email: email,
                phone: phone,
                digitalId: digitalId,
                idType: 'passport',
                location: 'Mumbai, Maharashtra',
                joinedDate: new Date().toISOString().split('T')[0],
                safetyScore: 80,
                isVerified: false
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Serve main HTML file
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
async function startServer() {
    await connectMongoDB();
    
    app.listen(PORT, () => {
        console.log(`
🚀 Quick Server running on port ${PORT}
🌐 Frontend: http://localhost:${PORT}
📊 API Health: http://localhost:${PORT}/api/health
        `);
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
