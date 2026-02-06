# 🚀 Rezerwacje Backend API

## Overview

Backend API for **Gościniec Rodzinny** reservation system. Built with Express.js, TypeScript, PostgreSQL, and Prisma ORM.

### Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.18
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Cache**: Redis 7+ (optional)
- **Testing**: Jest + Supertest
- **Security**: Helmet, bcrypt, JWT
- **Email**: Nodemailer + Bull Queue
- **Logging**: Winston

---

## Project Structure

```
apps/backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── routes/             # API routes
│   ├── middlewares/        # Express middlewares
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── tests/              # Test setup
│   └── server.ts           # Express app entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── Dockerfile              # Multi-stage Docker build
├── jest.config.js          # Jest configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Local Development

#### Using Docker Compose
```bash
cd ../..  # Go to project root
docker-compose up -d
docker-compose exec backend npm run prisma:migrate:dev
```

#### Manual Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env.local

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/rezerwacje"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Start development server
npm run dev
```

---

## Available Scripts

### Development
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript to dist/
npm start                # Run built application
```

### Database
```bash
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate:dev   # Create and run migrations
npm run prisma:migrate:deploy # Run migrations in production
npm run prisma:studio        # Open Prisma Studio UI
npm run seed                 # Seed database with initial data
```

### Testing
```bash
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests only
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

---

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "ValidPass123!",
  "firstName": "Jan",
  "lastName": "Kowalski"
}

Response 201:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "role": "EMPLOYEE"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "User registered successfully"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "ValidPass123!"
}

Response 200:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Logged in successfully"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response 200:
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

#### Password Requirements
```http
GET /api/auth/password-requirements

Response 200:
{
  "success": true,
  "data": {
    "requirements": [
      "Minimum 12 characters",
      "At least 1 uppercase letter (A-Z)",
      "At least 1 lowercase letter (a-z)",
      "At least 1 digit (0-9)",
      "At least 1 special character (!@#$%^&*)"
    ]
  }
}
```

#### Health Check
```http
GET /api/health

Response 200:
{
  "status": "ok",
  "timestamp": "2026-02-06T15:04:00.000Z",
  "uptime": 123.456
}
```

---

## Password Requirements

All passwords must meet these security requirements:
- ✅ Minimum **12 characters**
- ✅ At least **1 uppercase letter** (A-Z)
- ✅ At least **1 lowercase letter** (a-z)
- ✅ At least **1 digit** (0-9)
- ✅ At least **1 special character** (!@#$%^&*)

**Examples of valid passwords**:
- `ValidPass123!`
- `MyPassword@2024`
- `Test#Secure99`

---

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:password@localhost:5432/rezerwacje
JWT_SECRET=your-secret-key-min-32-chars-production
PORT=3001
```

### Optional
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_EXPIRY=7d
LOG_LEVEL=info

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@gosciniecrodzinny.pl

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

---

## Error Handling

All errors return consistent response format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `500` - Internal Server Error

---

## Database Migrations

### Create a new migration
```bash
npm run prisma:migrate:dev -- --name migration_name
```

### View migration status
```bash
npm run prisma:migrate:resolve
```

### Reset database (dev only)
```bash
npm run prisma:migrate:reset
```

---

## Testing

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Check coverage
```bash
npm run test -- --coverage
```

**Coverage Target**: 80% across all files

---

## Security Best Practices

✅ **Implemented**:
- HTTPS/TLS ready (Helmet.js)
- CORS configured
- JWT token authentication
- Password hashing with bcrypt (10 rounds)
- SQL injection prevention (Prisma ORM)
- XSS protection (input sanitization)
- Rate limiting ready
- Security headers (Helmet)
- Secure password requirements

⚠️ **For Production**:
- Set strong `JWT_SECRET` (min 32 characters)
- Enable HTTPS/SSL
- Configure CORS appropriately
- Setup rate limiting
- Enable monitoring & logging
- Regular security audits
- Keep dependencies updated

---

## Logging

Logs are created using Winston logger:

- **Console output**: Development-friendly colors
- **File output**: `logs/error.log` and `logs/combined.log`
- **Log level**: Configurable via `LOG_LEVEL` env var

```bash
# View logs
tail -f logs/combined.log
tail -f logs/error.log
```

---

## Docker Support

### Build Docker image
```bash
docker build -t rezerwacje-backend:latest .
```

### Run Docker container
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-secret \
  rezerwacje-backend:latest
```

### Multi-stage build
The Dockerfile uses multi-stage build for optimized production images:
1. **Builder stage**: Install dependencies, compile TypeScript
2. **Runtime stage**: Only production dependencies

---

## Monitoring & Health Checks

Health check endpoint for Docker/Kubernetes:
```bash
curl http://localhost:3001/api/health
```

Docker HEALTHCHECK in Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', ...)"
```

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.

### Code Style
- **Linter**: ESLint with TypeScript support
- **Formatter**: Prettier (100 char line width)
- **Naming**: camelCase for variables/functions, PascalCase for classes

---

## Troubleshooting

### Database connection error
```bash
# Check PostgreSQL is running
docker-compose ps

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npm run db:check
```

### Port already in use
```bash
# Change PORT in .env
PORT=3002

# Or kill the process
lsof -i :3001
kill -9 <PID>
```

### Prisma migration issues
```bash
# Reset database (careful!)
npm run prisma:migrate:reset

# Resolve migration conflict
npm run prisma:migrate:resolve

# Generate Prisma client
npm run prisma:generate
```

---

## Performance Tips

1. **Database Indexes**: Already configured in Prisma schema
2. **Connection Pooling**: Configure in DATABASE_URL
3. **Caching**: Redis integration ready in Sprint 3
4. **Query Optimization**: Use Prisma select() to fetch only needed fields
5. **Rate Limiting**: To be implemented in Sprint 4

---

## Next Steps (Sprint 2)

- [ ] Reservation CRUD endpoints
- [ ] Price calculator service
- [ ] Reservation validation rules
- [ ] Hall management endpoints
- [ ] Client management endpoints

---

## License

PROPRIETARY - Gościniec Rodzinny

---

**Status**: 🔜 Sprint 1 - Backend Foundation
**Last Updated**: 06.02.2026
