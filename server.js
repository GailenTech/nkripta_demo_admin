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
app.use(cors());
app.use(express.json());
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