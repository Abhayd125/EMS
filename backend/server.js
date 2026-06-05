require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { swaggerUi, specs } = require('./config/swagger');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const departmentRoutes = require('./routes/department');
const skillRoutes = require('./routes/skill');
const statsRoutes = require('./routes/stats');
const leaveRoutes = require('./routes/leave');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // React default port
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaves', leaveRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Employee Management System API is running.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});