# Productivity Management Dashboard API

A comprehensive backend API for managing tasks, tracking progress, and gaining insights into productivity. Built with Express.js and MongoDB.

## Features

### Core Features ✅
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Task Management** - Full CRUD operations for tasks with advanced properties
- **Task Status & Deadline Handling** - Automatic overdue detection and status tracking
- **Search & Filtering** - Advanced search and filtering capabilities
- **Productivity Dashboard** - Aggregated analytics and insights

### Additional Features 🧁
- **Recurring Tasks** - Support for daily and weekly recurring tasks
- **Background Jobs** - Automatic overdue detection and recurring task creation using cron
- **Logging** - Comprehensive logging of all operations
- **Input Validation** - Request validation using Joi
- **Security** - Helmet for security headers, CORS support

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Logging**: Winston
- **Background Jobs**: node-cron
- **Security**: Helmet, bcryptjs

## Installation

1. **Clone or download the project**
```bash
cd pro-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create/update `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/productivity-dashboard
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Run the server**
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Task Routes (`/api/tasks`)
**All routes require authentication. Include token in header:**
```
Authorization: Bearer {token}
```

#### Create Task
```
POST /api/tasks
Content-Type: application/json

{
  "title": "Complete project report",
  "description": "Finish the quarterly project report",
  "priority": "High",
  "status": "Pending",
  "deadline": "2026-02-15T00:00:00Z",
  "tags": ["work", "report"],
  "recurring": {
    "enabled": false,
    "frequency": "daily"
  }
}

Response: 201 Created
{
  "success": true,
  "message": "Task created successfully",
  "data": { task_object }
}
```

#### Get All Tasks (with filters)
```
GET /api/tasks?status=Pending&priority=High&search=report&sortBy=-createdAt

Query Parameters:
- status: "Pending", "In Progress", "Completed"
- priority: "Low", "Medium", "High"
- search: Search in title or description
- startDate: Filter tasks by deadline start date (ISO format)
- endDate: Filter tasks by deadline end date (ISO format)
- tags: Comma-separated tag names
- sortBy: Field to sort by (default: -createdAt)

Response: 200 OK
{
  "success": true,
  "count": 5,
  "data": [ task_objects ]
}
```

#### Get Single Task
```
GET /api/tasks/:id

Response: 200 OK
{
  "success": true,
  "data": { task_object }
}
```

#### Update Task
```
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "Completed",
  "priority": "Medium"
}

Response: 200 OK
{
  "success": true,
  "message": "Task updated successfully",
  "data": { updated_task_object }
}
```

#### Delete Task
```
DELETE /api/tasks/:id

Response: 200 OK
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Dashboard Routes (`/api/dashboard`)
**All routes require authentication.**

#### Get Overview
```
GET /api/dashboard/overview

Response: 200 OK
{
  "success": true,
  "data": {
    "totalTasks": 25,
    "completedTasks": 15,
    "pendingTasks": 7,
    "inProgressTasks": 3,
    "overdueTasks": 2,
    "completionRate": 60
  }
}
```

#### Get Statistics
```
GET /api/dashboard/statistics?period=week

Query Parameters:
- period: "week" or "month" (default: "week")

Response: 200 OK
{
  "success": true,
  "data": {
    "period": "week",
    "completedInPeriod": 5,
    "createdInPeriod": 8,
    "priorityDistribution": [
      { "_id": "High", "count": 4 },
      { "_id": "Medium", "count": 3 },
      { "_id": "Low", "count": 1 }
    ],
    "statusDistribution": [
      { "_id": "Completed", "count": 5 },
      { "_id": "Pending", "count": 2 },
      { "_id": "In Progress", "count": 1 }
    ],
    "completionTrend": [
      { "_id": "2026-01-15", "count": 2 },
      { "_id": "2026-01-16", "count": 3 }
    ]
  }
}
```

#### Get Productivity Score
```
GET /api/dashboard/productivity-score

Response: 200 OK
{
  "success": true,
  "data": {
    "score": 75,
    "level": "Advanced",
    "totalTasks": 25,
    "completedTasks": 15,
    "completionRate": 60,
    "overdueTasks": 2
  }
}
```

## Task Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| title | String | Yes | Task title (max 100 chars) |
| description | String | No | Task description (max 500 chars) |
| priority | String | No | "Low", "Medium", "High" (default: "Medium") |
| status | String | No | "Pending", "In Progress", "Completed" (default: "Pending") |
| deadline | Date | No | Task deadline |
| tags | Array | No | Array of tag strings |
| recurring | Object | No | Recurring task settings |
| isOverdue | Boolean | Auto | Automatically set based on deadline |
| completedAt | Date | Auto | Set when status changes to "Completed" |

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional error details (in development only)"
}
```

Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not authorized for resource)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

Include JWT token in request headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires in 7 days (configurable in `.env`).

## Logging

Logs are stored in:
- `error.log` - Error logs only
- `combined.log` - All logs

Logs include:
- Timestamp
- Log level
- Service name
- Message and context

## Background Jobs

### Overdue Task Detection
Runs hourly at the top of the hour. Automatically marks tasks as overdue if:
- Deadline has passed
- Task status is not "Completed"

### Recurring Tasks
Runs daily at 2 AM UTC. Creates new instances of recurring tasks:
- Daily tasks: New task created 24 hours from previous deadline
- Weekly tasks: New task created 7 days from previous deadline

## Development

### Project Structure
```
src/
├── config/          # Configuration files
│   └── database.js  # Database connection
├── middleware/      # Express middleware
│   ├── auth.js      # Authentication & authorization
│   └── validation.js # Input validation
├── models/          # Database models
│   ├── User.js      # User schema
│   └── Task.js      # Task schema
├── routes/          # API routes
│   ├── auth.js      # Authentication endpoints
│   ├── tasks.js     # Task endpoints
│   └── dashboard.js # Dashboard endpoints
├── utils/           # Utility functions
│   ├── logger.js    # Logging setup
│   └── jobs.js      # Background jobs
├── app.js           # Express app setup
└── server.js        # Server entry point
```

### Scripts

```bash
# Start in development mode with hot reload
npm run dev

# Start in production mode
npm start

# Run tests (to be implemented)
npm test
```

## Validation Rules

### User Registration
- Username: 3-30 alphanumeric characters, required
- Email: Valid email format, required
- Password: Minimum 6 characters, required

### Task Creation
- Title: Max 100 characters, required
- Description: Max 500 characters
- Priority: "Low", "Medium", "High"
- Status: "Pending", "In Progress", "Completed"
- Deadline: Valid ISO date format
- Tags: Array of strings

## Security Considerations

1. **Passwords** - Hashed using bcrypt with 10 salt rounds
2. **JWT** - Signed with secret key, 7-day expiration
3. **CORS** - Enabled for cross-origin requests
4. **Headers** - Helmet.js for security headers
5. **Validation** - All inputs validated with Joi
6. **Authorization** - Users can only access their own tasks

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Task sharing with other users
- [ ] Comments and collaboration on tasks
- [ ] Mobile app integration
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Task templates
- [ ] Priority levels calculation
- [ ] Bulk operations
- [ ] Export to CSV/PDF

## Support

For issues or questions, please check the logs or review the API documentation above.

## License

ISC
