# Bon Voyage Backend API

A comprehensive backend system for the Bon Voyage tourist safety application with real-time features, geo-fencing, evidence logging, and police dashboard integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- MongoDB
- PostgreSQL
- Redis

### Development Setup

1. **Clone and Install**
```bash
git clone <your-repo>
cd Bon-voyage-main
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Development Environment**
```bash
# Using Docker (Recommended)
npm run docker:dev

# Or manually
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Police Dashboard: http://localhost:3000/police-dashboard.html
- API Documentation: http://localhost:3000/api/docs

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + PostgreSQL + Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **File Upload**: Multer
- **Containerization**: Docker

### Project Structure
```
backend/
├── app.js                 # Main Express application
├── routes/               # API route handlers
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management
│   ├── geofences.js     # Geo-fencing system
│   ├── evidence.js      # Evidence logging
│   ├── emergency.js     # Emergency alerts
│   └── ...
├── models/              # Database models
│   ├── User.js         # User schema
│   ├── Geofence.js     # Geo-fence schema
│   ├── Evidence.js     # Evidence schema
│   └── ...
├── middleware/          # Custom middleware
│   └── auth.js         # JWT authentication
└── utils/              # Utility functions
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/emergency` - Emergency access
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/location` - Get user location
- `PUT /api/users/location` - Update location

### Geo-fences
- `GET /api/geofences` - Get all geo-fences
- `POST /api/geofences` - Create geo-fence
- `PUT /api/geofences/:id` - Update geo-fence
- `DELETE /api/geofences/:id` - Delete geo-fence
- `POST /api/geofences/check-location` - Check if user is in restricted area

### Evidence
- `GET /api/evidence` - Get all evidence
- `POST /api/evidence` - Log new evidence
- `GET /api/evidence/:id` - Get evidence by ID
- `PUT /api/evidence/:id` - Update evidence
- `DELETE /api/evidence/:id` - Delete evidence

### Emergency
- `POST /api/emergency/alert` - Create emergency alert
- `GET /api/emergency` - Get all emergencies

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
MONGODB_URL=mongodb://user:pass@localhost:27017/db
REDIS_URL=redis://localhost:6379

# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12

# External APIs
GOOGLE_MAPS_API_KEY=your-key
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

## 🐳 Docker Deployment

### Development
```bash
# Start development environment
npm run docker:dev

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Deploy to production
npm run docker:prod

# Or use deployment script
./deploy.sh prod
```

### Docker Services
- **Backend**: Node.js application
- **PostgreSQL**: Primary database
- **MongoDB**: Document storage
- **Redis**: Caching & sessions
- **Nginx**: Reverse proxy (production)

## 🔌 Real-time Features

### WebSocket Events
- `join-state-chat` - Join state-based chat
- `state-chat-message` - Send chat message
- `join-police-dashboard` - Join police dashboard
- `geofence-alert` - Geo-fence violation alert
- `emergency-alert` - Emergency broadcast

### Usage Example
```javascript
const socket = io('http://localhost:3000');

// Join state chat
socket.emit('join-state-chat', 'Maharashtra');

// Send message
socket.emit('state-chat-message', {
    state: 'Maharashtra',
    message: 'Hello everyone!',
    user: 'John Doe'
});

// Listen for messages
socket.on('new-state-message', (data) => {
    console.log('New message:', data);
});
```

## 🗄️ Database Models

### User Model
```javascript
{
    name: String,
    email: String (unique),
    phone: String,
    digitalId: String (unique),
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    safetyScore: Number (0-100),
    isVerified: Boolean
}
```

### Geofence Model
```javascript
{
    name: String,
    description: String,
    latitude: Number,
    longitude: Number,
    radius: Number (meters),
    state: String,
    active: Boolean
}
```

### Evidence Model
```javascript
{
    type: String (photo|video|audio|document|witness|physical|digital|other),
    title: String,
    description: String,
    location: Object,
    officer: ObjectId,
    priority: String (low|medium|high|critical),
    tags: [String],
    file: Object,
    status: String (logged|under_review|verified|rejected|archived)
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent abuse
- **CORS Protection** - Cross-origin security
- **Input Validation** - Data sanitization
- **File Upload Security** - Type and size restrictions
- **Helmet.js** - Security headers

## 📊 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs
```bash
# View application logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f postgres
docker-compose logs -f mongodb
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

## 🚀 Deployment

### Manual Deployment
1. Set up production environment variables
2. Build Docker images
3. Deploy with docker-compose
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates

### Automated Deployment
```bash
# Use deployment script
./deploy.sh prod
```

## 📝 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

**Bon Voyage Backend** - Secure, Scalable, Real-time Tourist Safety System 🚀
