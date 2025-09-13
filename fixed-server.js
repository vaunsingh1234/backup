const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const PORT = 3001;

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('.'));

// In-memory data storage (replaces database)
let users = [
    {
        id: 'TD-2024-01-001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
        digitalId: 'TD-2024-01-001',
        idType: 'passport',
        location: 'Mumbai, Maharashtra',
        joinedDate: '2024-01-15',
        safetyScore: 85,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'TD-2024-01-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        password: 'password123',
        digitalId: 'TD-2024-01-002',
        idType: 'passport',
        location: 'Delhi, India',
        joinedDate: '2024-01-16',
        safetyScore: 92,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

let incidents = [
    {
        id: 'INC-001',
        type: 'theft',
        location: 'Mumbai Central',
        description: 'Bag stolen from tourist',
        severity: 'medium',
        status: 'investigating',
        reportedBy: 'TD-2024-01-001',
        reportedAt: new Date(),
        assignedTo: 'POL-001'
    },
    {
        id: 'INC-002',
        type: 'medical',
        location: 'Goa Beach',
        description: 'Tourist injured in water sports',
        severity: 'high',
        status: 'resolved',
        reportedBy: 'TD-2024-01-002',
        reportedAt: new Date(),
        assignedTo: 'POL-002'
    }
];

let emergencies = [
    {
        id: 'EMG-001',
        type: 'medical',
        location: 'Kerala Backwaters',
        description: 'Tourist needs immediate medical attention',
        severity: 'critical',
        status: 'active',
        reportedBy: 'TD-2024-01-001',
        reportedAt: new Date(),
        coordinates: { lat: 9.9312, lng: 76.2673 }
    }
];

let geofences = [
    {
        id: 'GEO-001',
        name: 'Mumbai Tourist Zone',
        location: 'Mumbai, Maharashtra',
        radius: 5000,
        type: 'safety',
        status: 'active',
        createdAt: new Date()
    },
    {
        id: 'GEO-002',
        name: 'Goa Beach Area',
        location: 'Goa, India',
        radius: 3000,
        type: 'monitoring',
        status: 'active',
        createdAt: new Date()
    }
];

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        users: users.length,
        incidents: incidents.length,
        emergencies: emergencies.length
    });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                digitalId: user.digitalId,
                idType: user.idType,
                location: user.location,
                joinedDate: user.joinedDate,
                safetyScore: user.safetyScore,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/signup', (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        const digitalId = `TD-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.random().toString().substr(2, 3)}`;
        
        const newUser = {
            id: digitalId,
            name: name,
            email: email,
            phone: phone,
            password: password,
            digitalId: digitalId,
            idType: 'passport',
            location: 'Mumbai, Maharashtra',
            joinedDate: new Date().toISOString().split('T')[0],
            safetyScore: 80,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        users.push(newUser);
        
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        res.status(201).json({
            success: true,
            message: 'Digital Tourist ID created successfully',
            token: token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                digitalId: newUser.digitalId,
                idType: newUser.idType,
                location: newUser.location,
                joinedDate: newUser.joinedDate,
                safetyScore: newUser.safetyScore,
                isVerified: newUser.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin dashboard endpoints
app.get('/api/admin/users', (req, res) => {
    res.json({
        success: true,
        users: users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            digitalId: user.digitalId,
            location: user.location,
            joinedDate: user.joinedDate,
            safetyScore: user.safetyScore,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        }))
    });
});

app.get('/api/admin/incidents', (req, res) => {
    res.json({
        success: true,
        incidents: incidents
    });
});

app.get('/api/admin/emergencies', (req, res) => {
    res.json({
        success: true,
        emergencies: emergencies
    });
});

app.get('/api/admin/geofences', (req, res) => {
    res.json({
        success: true,
        geofences: geofences
    });
});

app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalUsers: users.length,
            verifiedUsers: users.filter(u => u.isVerified).length,
            totalIncidents: incidents.length,
            activeIncidents: incidents.filter(i => i.status === 'investigating').length,
            totalEmergencies: emergencies.length,
            activeEmergencies: emergencies.filter(e => e.status === 'active').length,
            totalGeofences: geofences.length,
            activeGeofences: geofences.filter(g => g.status === 'active').length
        }
    });
});

// User endpoints
app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        users: users
    });
});

app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    res.json({
        success: true,
        user: user
    });
});

// Incident endpoints
app.get('/api/incidents', (req, res) => {
    res.json({
        success: true,
        incidents: incidents
    });
});

app.post('/api/incidents', (req, res) => {
    const { type, location, description, severity, reportedBy } = req.body;
    
    const newIncident = {
        id: `INC-${Date.now()}`,
        type,
        location,
        description,
        severity,
        status: 'reported',
        reportedBy,
        reportedAt: new Date(),
        assignedTo: null
    };
    
    incidents.push(newIncident);
    
    // Emit real-time update
    io.emit('new-incident', newIncident);
    
    res.status(201).json({
        success: true,
        message: 'Incident reported successfully',
        incident: newIncident
    });
});

// Emergency endpoints
app.get('/api/emergencies', (req, res) => {
    res.json({
        success: true,
        emergencies: emergencies
    });
});

app.post('/api/emergencies', (req, res) => {
    const { type, location, description, severity, reportedBy, coordinates } = req.body;
    
    const newEmergency = {
        id: `EMG-${Date.now()}`,
        type,
        location,
        description,
        severity,
        status: 'active',
        reportedBy,
        reportedAt: new Date(),
        coordinates
    };
    
    emergencies.push(newEmergency);
    
    // Emit real-time update
    io.emit('new-emergency', newEmergency);
    
    res.status(201).json({
        success: true,
        message: 'Emergency reported successfully',
        emergency: newEmergency
    });
});

// Geofence endpoints
app.get('/api/geofences', (req, res) => {
    res.json({
        success: true,
        geofences: geofences
    });
});

app.post('/api/geofences', (req, res) => {
    const { name, location, radius, type } = req.body;
    
    const newGeofence = {
        id: `GEO-${Date.now()}`,
        name,
        location,
        radius,
        type,
        status: 'active',
        createdAt: new Date()
    };
    
    geofences.push(newGeofence);
    
    res.status(201).json({
        success: true,
        message: 'Geofence created successfully',
        geofence: newGeofence
    });
});

// Evidence endpoints
app.get('/api/evidence', (req, res) => {
    res.json({
        success: true,
        evidence: [
            {
                id: '1',
                type: 'photo',
                title: 'Sample Evidence',
                description: 'Test evidence entry',
                location: 'Shillong, Meghalaya',
                priority: 'medium',
                timestamp: new Date().toISOString()
            }
        ]
    });
});

app.post('/api/evidence', (req, res) => {
    const { type, title, description, location, priority } = req.body;
    
    const newEvidence = {
        id: Date.now().toString(),
        type,
        title,
        description,
        location,
        priority,
        timestamp: new Date().toISOString()
    };
    
    res.status(201).json({
        success: true,
        message: 'Evidence logged successfully',
        evidence: newEvidence
    });
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-state-chat', (state) => {
        socket.join(`state-${state}`);
        socket.emit('joined-state-chat', state);
    });

    socket.on('state-chat-message', (data) => {
        socket.to(`state-${data.state}`).emit('new-state-message', data);
    });

    socket.on('join-police-dashboard', (policeId) => {
        socket.join(`police-${policeId}`);
    });

    socket.on('geofence-alert', (alertData) => {
        io.to('police-dashboard').emit('new-alert', alertData);
    });

    socket.on('emergency-alert', (emergencyData) => {
        io.emit('emergency-broadcast', emergencyData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Serve main HTML file for all non-API routes
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
httpServer.listen(PORT, () => {
    console.log(`
🚀 Fixed Server running on port ${PORT}
🌐 Frontend: http://localhost:${PORT}
📊 API Health: http://localhost:${PORT}/api/health
🔌 WebSocket server active for real-time features
📊 Admin Dashboard: http://localhost:${PORT}/police-dashboard.html
👤 Login Page: http://localhost:${PORT}/auth.html
    `);
});

module.exports = app;
