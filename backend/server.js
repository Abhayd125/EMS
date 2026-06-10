require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { swaggerUi, specs } = require('./config/swagger');
const errorMiddleware = require('./middleware/errorMiddleware');
const logger = require('./config/logger');
const { initCronJobs } = require('./jobs/cronJobs');

// Import V1 routes
const authRoutes = require('./routes/v1/auth');
const employeeRoutes = require('./routes/v1/employee');
const departmentRoutes = require('./routes/v1/department');
const skillRoutes = require('./routes/v1/skill');
const statsRoutes = require('./routes/v1/stats');
const leaveRoutes = require('./routes/v1/leave');
const assetRoutes = require('./routes/v1/asset');
const notificationRoutes = require('./routes/v1/notification');
const reportRoutes = require('./routes/v1/report');
const healthRoutes = require('./routes/v1/health');
const userRoutes = require('./routes/v1/users');
const attendanceRoutes = require('./routes/v1/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      /vercel\.app$/.test(origin);
                      
    if (!isAllowed) {
      return callback(new Error('CORS blocked access from this origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static upload folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// V1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Fallback Routes (pointing to V1)
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('ORA Employee Management System API is running.');
});

// Centralized error handling middleware
app.use(errorMiddleware);

// Initialize Cron Jobs
initCronJobs();

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});