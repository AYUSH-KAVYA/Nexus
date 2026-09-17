require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { AppError } = require('./utils/errors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const stakeholderRoutes = require('./routes/stakeholders');
const taskRoutes = require('./routes/tasks');
const dependencyRoutes = require('./routes/dependencies');
const approvalRoutes = require('./routes/approvals');
const changeRoutes = require('./routes/changes');
const impactRoutes = require('./routes/impact');
const bottleneckRoutes = require('./routes/bottleneck');
const alertRoutes = require('./routes/alerts');

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/stakeholders', stakeholderRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/projects/:projectId/dependencies', dependencyRoutes);
app.use('/api/projects/:projectId/approvals', approvalRoutes);
app.use('/api/projects/:projectId/changes', changeRoutes);
app.use('/api/projects/:projectId/impact', impactRoutes);
app.use('/api/projects/:projectId/bottleneck', bottleneckRoutes);
app.use('/api/alerts', alertRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexus server running on port ${PORT}`);
});
