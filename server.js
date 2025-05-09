// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./src/config/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
// Configure CORS to allow the admin UI to connect
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para capturar el cuerpo raw para webhooks de Stripe
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});

// Configurar JSON para procesamiento normal
app.use(express.json({ 
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/billing/webhook') {
      req.rawBody = buf.toString();
    }
  }
}));

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rutas
app.use('/api', routes);

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
async function startServer() {
  try {
    // Sincronizar base de datos
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos con la base de datos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      try {
        await sequelize.sync({ alter: true });
        logger.info('Modelos sincronizados con la base de datos');
      } catch (syncError) {
        logger.error('Error al sincronizar modelos:', syncError);
      }
    }
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();