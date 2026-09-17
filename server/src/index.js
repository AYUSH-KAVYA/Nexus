require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { AppError } = require('./utils/errors');

// ── Middleware ────────────────────────────────────────────────
const { authenticate } = require('./middleware/auth');
const { requireAppEntitlement } = require('./middleware/entitlement');

// ── Platform routes (no entitlement check) ───────────────────
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const stakeholderRoutes = require('./routes/stakeholders');
const alertRoutes = require('./routes/alerts');
const organizationRoutes = require('./routes/organizations');

// ── Nexus app routes (require 'nexus' entitlement) ──────────
const taskRoutes = require('./routes/tasks');
const dependencyRoutes = require('./routes/dependencies');
const approvalRoutes = require('./routes/approvals');
const changeRoutes = require('./routes/changes');
const impactRoutes = require('./routes/impact');
const bottleneckRoutes = require('./routes/bottleneck');

// ── Nexus Signal routes (require 'nexus_signal' entitlement) ─
const signalConversationsRoutes = require('./routes/signal/conversations');
const signalItemsRoutes = require('./routes/signal/items');
const signalDemoRoutes = require('./routes/signal/demo');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Nexus Platform API (AS-01 + Signal)'
  });
});

// ══════════════════════════════════════════════════════════════
// PLATFORM ROUTES — no entitlement, available to any authed user
// ══════════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/stakeholders', stakeholderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/organizations', organizationRoutes);

// ══════════════════════════════════════════════════════════════
// NEXUS APP ROUTES — require 'nexus' entitlement
// (authenticate is called per-route inside these routers)
// ══════════════════════════════════════════════════════════════
const nexusEntitlement = [authenticate, requireAppEntitlement('nexus')];
app.use('/api/projects/:projectId/tasks', nexusEntitlement, taskRoutes);
app.use('/api/projects/:projectId/dependencies', nexusEntitlement, dependencyRoutes);
app.use('/api/projects/:projectId/approvals', nexusEntitlement, approvalRoutes);
app.use('/api/projects/:projectId/changes', nexusEntitlement, changeRoutes);
app.use('/api/projects/:projectId/impact', nexusEntitlement, impactRoutes);
app.use('/api/projects/:projectId/bottleneck', nexusEntitlement, bottleneckRoutes);

// ══════════════════════════════════════════════════════════════
// NEXUS SIGNAL ROUTES — require 'nexus_signal' entitlement
// (authenticate applied here since Signal routes had no auth)
// ══════════════════════════════════════════════════════════════
const signalEntitlement = [authenticate, requireAppEntitlement('nexus_signal')];
app.use('/api/conversations', signalEntitlement, signalConversationsRoutes);
app.use('/api/items', signalEntitlement, signalItemsRoutes);
app.use('/api/demo', signalDemoRoutes);

// ── 404 catch-all ────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('ERROR 💥', err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went very wrong!'
  });
});

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus Platform API running on port ${PORT} (Nexus + Signal unified)`);
  });
}

module.exports = app;
