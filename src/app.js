require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Middlewares
const { errorHandler, notFound, sanitizeInput, requestLogger } = require('./middlewares/validation');
const { auditMiddleware } = require('./middlewares/audit');

// Routes
const authRoutes = require('./modules/auth/authRoutes');
const userRoutes = require('./modules/users/userRoutes');
const memberRoutes = require('./modules/members/memberRoutes');
const branchRoutes = require('./modules/branches/branchRoutes');
const membershipRoutes = require('./modules/memberships/membershipRoutes');
const paymentRoutes = require('./modules/payments/paymentRoutes');
const classRoutes = require('./modules/classes/classRoutes');
const checkInRoutes = require('./modules/checkins/checkInRoutes');
const reportRoutes = require('./modules/reports/reportRoutes');
const auditRoutes = require('./modules/audit/auditRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');

const app = express();

// Trust proxy for Vercel and other proxy environments
app.set('trust proxy', true);

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Allow all origins
const corsOptions = {
  origin: true, // Permitir todos los orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom request logger
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Audit middleware - registra todas las operaciones de modificación
app.use(auditMiddleware({
  exclude: [
    '/health',
    '/api-docs',
    '/api-docs.json',
    '/favicon.ico'
  ]
}));

// Audit middleware - registra automáticamente las acciones
app.use(auditMiddleware({
  exclude: ['/health', '/api-docs', '/api/auth/refresh', '/api-docs.json']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GymMaster API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Documentation disabled for production

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/members`, memberRoutes);
app.use(`${API_PREFIX}/branches`, branchRoutes);
app.use(`${API_PREFIX}/memberships`, membershipRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/classes`, classRoutes);
app.use(`${API_PREFIX}/checkins`, checkInRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/audit`, auditRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏋️‍♂️ Bienvenido a GymMaster API',
    version: '1.0.0',
    health: '/health',
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;