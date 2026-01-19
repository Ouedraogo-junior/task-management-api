require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./src/config/database');

const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

const app = express();

// Connexion à la base de données
connectDB().catch(err => {
  console.error('❌ Erreur de connexion DB:', err);
  process.exit(1);
});

// Configuration CORS AVANT tout le reste
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Permettre les requêtes sans origin (mobile apps, postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // En dev, on accepte tout
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 200 // ⚠️ IMPORTANT : 200 au lieu de 204
};

app.use(cors(corsOptions));

// Gérer explicitement les requêtes OPTIONS pour toutes les routes
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet APRÈS CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Rate limiting - appliqué APRÈS les routes OPTIONS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'OPTIONS', // ⚠️ Skip rate limit pour OPTIONS
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Logger en développement
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de gestion de tâches collaborative',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS autorisé pour: localhost:3000\n`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM reçu, arrêt gracieux du serveur');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;