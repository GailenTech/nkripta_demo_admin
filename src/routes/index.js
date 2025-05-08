// src/routes/index.js
const express = require('express');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const organizationRoutes = require('./organizationRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');

const router = express.Router();

// Ruta básica para verificar que la API esté funcionando
router.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/organizations', organizationRoutes);
router.use('/billing', subscriptionRoutes);

module.exports = router;