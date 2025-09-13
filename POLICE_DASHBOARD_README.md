# Police Dashboard - Tourist Safety System

## 🚨 Overview

This police dashboard provides law enforcement with comprehensive tools to manage tourist safety through:

1. **Geofencing Management** - Create and manage geographical boundaries
2. **Tourist Data Access** - Monitor tourist locations and documents  
3. **Panic Button Response** - Handle emergency alerts in real-time
4. **Live Map Visualization** - Track tourists and incidents on an interactive map
5. **Real-time Updates** - WebSocket-powered live updates

## 🏗️ Architecture & Integration

### Backend API Structure
```
src/
├── main.ts                 # NestJS application entry point
├── app.module.ts           # Main module importing all features
├── entities/               # Database models
│   ├── police-user.entity.ts      # Police officer accounts
│   ├── tourist.entity.ts          # Tourist data
│   ├── geofence.entity.ts         # Geographical boundaries
│   ├── emergency.entity.ts        # Panic button incidents
│   └── tourist-document.entity.ts # Identity documents
└── modules/
    ├── auth/               # JWT authentication for police
    ├── geofencing/         # Geofence CRUD operations
    ├── tourist/            # Tourist data access
    ├── emergency/          # Emergency response system
    ├── dashboard/          # Dashboard aggregated data
    └── websocket/          # Real-time updates
```

### API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - Police officer login
- `GET /api/v1/auth/profile` - Get current user

#### Geofencing Management
- `GET /api/v1/geofencing` - List all geofences
- `POST /api/v1/geofencing` - Create new geofence
- `PUT /api/v1/geofencing/:id` - Update geofence
- `DELETE /api/v1/geofencing/:id` - Delete geofence
- `POST /api/v1/geofencing/check-location` - Check if location is within geofences

#### Tourist Data Access
- `GET /api/v1/tourists` - List tourists with filters
- `GET /api/v1/tourists/:id` - Get tourist details
- `GET /api/v1/tourists/:id/documents` - Get tourist documents
- `GET /api/v1/tourists/:id/location-history` - Get movement history
- `PUT /api/v1/tourists/:id/status` - Update tourist status
- `GET /api/v1/tourists/active/map-view` - Get tourists for map display

#### Emergency Response
- `GET /api/v1/emergency` - List emergency alerts
- `GET /api/v1/emergency/active` - Get active alerts
- `PUT /api/v1/emergency/:id/acknowledge` - Acknowledge alert
- `PUT /api/v1/emergency/:id/dispatch` - Dispatch responders
- `PUT /api/v1/emergency/:id/resolve` - Resolve emergency
- `GET /api/v1/emergency/map/view` - Get emergencies for map

#### Dashboard Data
- `GET /api/v1/dashboard/overview` - Dashboard summary
- `GET /api/v1/dashboard/metrics` - Key performance metrics
- `GET /api/v1/dashboard/map-data` - All map data (tourists, emergencies, geofences)

### Frontend Integration

The dashboard frontend (`public/police-dashboard.html`) connects to the backend APIs:

```javascript
// API calls to backend
const response = await fetch('/api/v1/dashboard/overview', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Real-time updates via WebSocket
const socket = io('/police-dashboard');
socket.on('emergency_alert', (data) => {
  // Update dashboard with new emergency
});
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Database
```bash
# Make sure PostgreSQL is running
createdb tourist_safety_db

# Run migrations (entities will auto-create tables in development)
npm run dev
```

### 3. Start the Server
```bash
npm run dev
```

### 4. Access the Dashboard
- **API Documentation**: http://localhost:3000/api/docs
- **Police Dashboard**: http://localhost:3000/police-dashboard.html
- **Main App**: http://localhost:3000/ (your existing app)

## 🔧 Configuration

### Environment Variables (.env)
```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tourist_safety_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret
```

### Database Connection
The system uses TypeORM with PostgreSQL. Entities are defined in `src/entities/` and automatically sync in development.

### Authentication
Police officers authenticate using JWT tokens. In production, integrate with your existing police authentication system.

## 📊 Features Breakdown

### 1. Geofencing Management
- **Create Borders**: Draw circles, polygons, or rectangles on the map
- **Zone Types**: Safe zones, restricted areas, tourist attractions, checkpoints
- **Alert Settings**: Configure entry/exit notifications and auto-dispatch
- **Real-time Validation**: Check tourist locations against geofences

### 2. Tourist Data Access
- **Live Tracking**: View real-time tourist locations on the map
- **Document Verification**: Access uploaded identity documents
- **Safety Scores**: Monitor AI-calculated safety ratings
- **Status Updates**: Mark tourists as missing, emergency, or safe
- **Location History**: Track movement patterns over time

### 3. Panic Button Response
- **Instant Alerts**: Receive real-time panic button notifications
- **Emergency Workflow**: Acknowledge → Dispatch → Resolve
- **Multi-channel Notifications**: SMS, push notifications, WebSocket updates
- **E-FIR Generation**: Automatically generate electronic FIRs for incidents
- **Response Metrics**: Track response times and resolution rates

### 4. Real-time Features
- **WebSocket Integration**: Live updates for all events
- **Map Updates**: Real-time tourist location changes
- **Alert Notifications**: Instant emergency notifications
- **Status Changes**: Live geofence and tourist status updates

## 🔒 Security Features

- **JWT Authentication**: Secure API access for police officers
- **Role-based Access**: Different permissions for officers, inspectors, admins
- **District-based Filtering**: Officers only see data from their jurisdiction
- **Encrypted Communications**: All data transmitted securely
- **Audit Logging**: Track all actions for accountability

## 🔌 Integration Points

### With Existing Tourist App
- **Panic Button**: Tourist app sends emergencies to this dashboard
- **Location Sharing**: Tourist locations appear on police map
- **Document Sync**: KYC documents accessible to police
- **Status Updates**: Police actions update tourist app status

### With External Systems
- **Police APIs**: Integration with existing police systems
- **E-FIR Systems**: Automated FIR generation
- **SMS/Email Services**: Emergency notifications
- **Mapping Services**: Google Maps/OpenStreetMap integration

## 📱 Mobile Responsive

The dashboard is fully responsive and works on:
- Desktop computers (primary use)
- Tablets (field operations)
- Mobile devices (emergency access)

## 🚨 Emergency Workflow

1. **Alert Received**: Tourist presses panic button
2. **Auto-dispatch**: System notifies nearby officers
3. **Acknowledgment**: Officer acknowledges receipt
4. **Response**: Officer dispatches to location
5. **Resolution**: Incident resolved and recorded
6. **E-FIR**: Automatic FIR generation if required

## 📈 Dashboard Metrics

- **Active Tourists**: Real-time count of tourists being tracked
- **Emergency Response**: Active alerts and average response time
- **Safety Scores**: Overall tourist safety indicators
- **Geofence Status**: Active zones and recent violations
- **Officer Activity**: On-duty status and workload distribution

This system provides a complete solution for police to monitor tourist safety, respond to emergencies, and manage geographical security zones effectively.
