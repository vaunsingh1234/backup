# 🗄️ Bon Voyage Database Management Guide

This comprehensive guide covers all aspects of database management for the Bon Voyage tourist safety application.

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Quick Access](#quick-access)
3. [Web Admin Panel](#web-admin-panel)
4. [Command Line Access](#command-line-access)
5. [Backup & Restore](#backup--restore)
6. [Health Monitoring](#health-monitoring)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)
9. [Security](#security)

## 🏗️ Database Overview

The Bon Voyage application uses a multi-database architecture:

### **PostgreSQL** (Primary Database)
- **Purpose**: Relational data storage
- **Container**: `bon-voyage-postgres-dev`
- **Port**: `5433` (external), `5432` (internal)
- **Database**: `tourist_safety_db`
- **User**: `postgres`
- **Password**: `password123`

**Tables:**
- `users` - User accounts and profiles
- `geofences` - Geo-fence definitions
- `incidents` - Reported incidents
- `emergencies` - Emergency records
- `evidence` - Evidence logs

### **MongoDB** (Document Database)
- **Purpose**: Document storage and real-time data
- **Container**: `bon-voyage-mongo-dev`
- **Port**: `27018` (external), `27017` (internal)
- **Database**: `tourist_safety_mongo`
- **User**: `admin`
- **Password**: `password123`

**Collections:**
- `users` - User documents
- `geofences` - Geo-fence documents
- `incidents` - Incident reports
- `emergencies` - Emergency records
- `evidence` - Evidence documents
- `chats` - Chat messages

### **Redis** (Cache & Session Store)
- **Purpose**: Caching and session management
- **Container**: `bon-voyage-redis-dev`
- **Port**: `6380` (external), `6379` (internal)
- **Password**: `password123`

**Key Patterns:**
- `session:*` - User sessions
- `user:*` - User data cache
- `location:*` - Location data
- `geofence:*` - Geo-fence cache
- `incident:*` - Incident cache

## 🚀 Quick Access

### **Web Admin Panel**
Access the comprehensive web-based database admin panel:
```
http://localhost:3000/db-admin.html
```

### **API Health Check**
Quick system health check:
```bash
curl http://localhost:3000/api/health
```

### **Container Status**
Check if all database containers are running:
```bash
docker-compose -f docker-compose.dev.yml ps
```

## 🌐 Web Admin Panel

The web admin panel provides a user-friendly interface for database management:

### **Features:**
- ✅ **Real-time Status Monitoring** - See connection status for all databases
- 📊 **Database Statistics** - View size, connections, and performance metrics
- 🔍 **Data Browser** - Browse tables, collections, and keys
- 🛠️ **Database Operations** - Backup, restore, optimize, and reset
- 📋 **System Overview** - Comprehensive system health dashboard

### **Access:**
1. Open your browser
2. Navigate to `http://localhost:3000/db-admin.html`
3. Use the interface to monitor and manage your databases

## 💻 Command Line Access

### **PostgreSQL Access**

**Connect to PostgreSQL:**
```bash
docker exec -it bon-voyage-postgres-dev psql -U postgres -d tourist_safety_db
```

**Common PostgreSQL Commands:**
```sql
-- List all tables
\dt

-- Describe a table
\d users

-- View all users
SELECT * FROM users;

-- Check database size
SELECT pg_size_pretty(pg_database_size('tourist_safety_db'));

-- View active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Exit
\q
```

### **MongoDB Access**

**Connect to MongoDB:**
```bash
docker exec -it bon-voyage-mongo-dev mongosh -u admin -p password123
```

**Common MongoDB Commands:**
```javascript
// List all databases
show dbs

// Switch to your database
use tourist_safety_mongo

// List all collections
show collections

// View all users
db.users.find()

// Count documents in a collection
db.users.countDocuments()

// Get database statistics
db.stats()

// Exit
exit
```

### **Redis Access**

**Connect to Redis:**
```bash
docker exec -it bon-voyage-redis-dev redis-cli -a password123
```

**Common Redis Commands:**
```redis
# List all keys
KEYS *

# Get a specific key
GET user:123

# Set a key
SET test:key "Hello World"

# Get key information
INFO memory

# Check Redis version
INFO server

# Exit
exit
```

## 💾 Backup & Restore

### **Automated Backup Script**

**Full Backup:**
```bash
./scripts/backup-databases.sh
```

**Backup Specific Database:**
```bash
# PostgreSQL only
./scripts/backup-databases.sh -p

# MongoDB only
./scripts/backup-databases.sh -m

# Redis only
./scripts/backup-databases.sh -r
```

**Custom Backup Directory:**
```bash
./scripts/backup-databases.sh -d /path/to/backups
```

### **Restore Script**

**List Available Backups:**
```bash
./scripts/restore-databases.sh -l
```

**Restore from Timestamp:**
```bash
./scripts/restore-databases.sh -t 20241201_143022
```

**Restore Specific Database:**
```bash
# PostgreSQL
./scripts/restore-databases.sh -p postgres_backup_20241201.sql

# MongoDB
./scripts/restore-databases.sh -m mongodb_backup_20241201

# Redis
./scripts/restore-databases.sh -r redis_backup_20241201.rdb
```

**Force Restore (No Confirmation):**
```bash
./scripts/restore-databases.sh --force -t 20241201_143022
```

### **Manual Backup Commands**

**PostgreSQL:**
```bash
docker exec bon-voyage-postgres-dev pg_dump -U postgres tourist_safety_db > backup.sql
```

**MongoDB:**
```bash
docker exec bon-voyage-mongo-dev mongodump --username admin --password password123 --db tourist_safety_mongo --out /backup
```

**Redis:**
```bash
docker exec bon-voyage-redis-dev redis-cli -a password123 BGSAVE
```

## 🏥 Health Monitoring

### **Health Monitor Script**

**Comprehensive Health Check:**
```bash
./scripts/db-health-monitor.sh -c
```

**Check Specific Service:**
```bash
# PostgreSQL
./scripts/db-health-monitor.sh -p

# MongoDB
./scripts/db-health-monitor.sh -m

# Redis
./scripts/db-health-monitor.sh -r

# API
./scripts/db-health-monitor.sh -a
```

**Continuous Monitoring:**
```bash
./scripts/db-health-monitor.sh -w
```

**View Recent Logs:**
```bash
./scripts/db-health-monitor.sh -l
```

**Set Email Alerts:**
```bash
./scripts/db-health-monitor.sh -e admin@example.com -c
```

### **Health Check Features:**
- ✅ **Container Status** - Verify containers are running and healthy
- 🔗 **Connection Testing** - Test database connections
- 📊 **Performance Metrics** - Monitor size, connections, memory usage
- 🚨 **Alert System** - Email notifications for failures
- 📋 **Logging** - Comprehensive health check logs

## 🔌 API Endpoints

### **Database Management API**

**Base URL:** `http://localhost:3000/api/db`

#### **PostgreSQL Endpoints:**
```bash
# Check PostgreSQL status
GET /api/db/postgres/status

# List all tables
GET /api/db/postgres/tables

# Get database statistics
GET /api/db/postgres/stats
```

#### **MongoDB Endpoints:**
```bash
# Check MongoDB status
GET /api/db/mongodb/status

# List all collections
GET /api/db/mongodb/collections

# Get database statistics
GET /api/db/mongodb/stats
```

#### **Redis Endpoints:**
```bash
# Check Redis status
GET /api/db/redis/status

# List all keys
GET /api/db/redis/keys

# Get Redis information
GET /api/db/redis/info

# Clear Redis cache
POST /api/db/redis/clear
```

#### **Database Operations:**
```bash
# Create backup
POST /api/db/backup

# Optimize databases
POST /api/db/optimize

# Reset databases (DANGEROUS!)
POST /api/db/reset

# Overall health check
GET /api/db/health
```

### **Example API Usage:**

**Check All Database Health:**
```bash
curl http://localhost:3000/api/db/health
```

**Get PostgreSQL Tables:**
```bash
curl http://localhost:3000/api/db/postgres/tables
```

**Clear Redis Cache:**
```bash
curl -X POST http://localhost:3000/api/db/redis/clear
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Container Not Running**
```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# Start containers
docker-compose -f docker-compose.dev.yml up -d

# View container logs
docker logs bon-voyage-postgres-dev
docker logs bon-voyage-mongo-dev
docker logs bon-voyage-redis-dev
```

#### **Connection Refused**
```bash
# Check if ports are available
netstat -tulpn | grep :5433
netstat -tulpn | grep :27018
netstat -tulpn | grep :6380

# Restart specific container
docker restart bon-voyage-postgres-dev
```

#### **Database Full**
```bash
# Check disk space
df -h

# Clean up old backups
rm -rf ./backups/old_backup_*

# Optimize databases
./scripts/db-health-monitor.sh -c
```

#### **Permission Denied**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check file permissions
ls -la scripts/
```

### **Log Files**

**Application Logs:**
```bash
# View backend logs
docker logs bon-voyage-backend-dev

# View database logs
docker logs bon-voyage-postgres-dev
docker logs bon-voyage-mongo-dev
docker logs bon-voyage-redis-dev
```

**Health Monitor Logs:**
```bash
# View health check logs
tail -f logs/db-health.log
```

## 🔒 Security

### **Production Security Checklist**

#### **Database Security:**
- [ ] Change default passwords
- [ ] Enable SSL/TLS connections
- [ ] Restrict network access
- [ ] Regular security updates
- [ ] Backup encryption

#### **Access Control:**
- [ ] Use strong passwords
- [ ] Implement user roles
- [ ] Enable audit logging
- [ ] Regular access reviews

#### **Network Security:**
- [ ] Firewall configuration
- [ ] VPN access only
- [ ] IP whitelisting
- [ ] Port restrictions

### **Security Commands**

**Change PostgreSQL Password:**
```bash
docker exec -it bon-voyage-postgres-dev psql -U postgres -c "ALTER USER postgres PASSWORD 'new_secure_password';"
```

**Change MongoDB Password:**
```bash
docker exec -it bon-voyage-mongo-dev mongosh -u admin -p password123 --eval "db.changeUserPassword('admin', 'new_secure_password')"
```

**Change Redis Password:**
```bash
# Edit docker-compose.dev.yml
# Change REDIS_PASSWORD environment variable
# Restart container
docker-compose -f docker-compose.dev.yml restart redis
```

## 📞 Support

### **Getting Help**

1. **Check Logs** - Always check logs first
2. **Health Monitor** - Use the health monitoring script
3. **Web Admin Panel** - Use the web interface for diagnostics
4. **Documentation** - Refer to this guide

### **Emergency Procedures**

**Complete System Reset:**
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Remove all data (DANGEROUS!)
docker-compose -f docker-compose.dev.yml down -v

# Restart fresh
docker-compose -f docker-compose.dev.yml up -d
```

**Data Recovery:**
```bash
# List available backups
./scripts/restore-databases.sh -l

# Restore from latest backup
./scripts/restore-databases.sh -t $(ls -t ./backups/backup_manifest_*.json | head -1 | grep -o '[0-9]\{8\}_[0-9]\{6\}')
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Check Status** | `docker-compose -f docker-compose.dev.yml ps` |
| **Health Check** | `./scripts/db-health-monitor.sh -c` |
| **Full Backup** | `./scripts/backup-databases.sh` |
| **List Backups** | `./scripts/restore-databases.sh -l` |
| **Web Admin** | `http://localhost:3000/db-admin.html` |
| **API Health** | `curl http://localhost:3000/api/health` |
| **PostgreSQL** | `docker exec -it bon-voyage-postgres-dev psql -U postgres -d tourist_safety_db` |
| **MongoDB** | `docker exec -it bon-voyage-mongo-dev mongosh -u admin -p password123` |
| **Redis** | `docker exec -it bon-voyage-redis-dev redis-cli -a password123` |

---

**📝 Last Updated:** December 2024  
**🔄 Version:** 1.0.0  
**👥 Maintained by:** Bon Voyage Development Team
