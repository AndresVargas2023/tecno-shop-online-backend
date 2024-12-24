const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Ruta protegida de administración
router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ message: 'Bienvenido al panel de administración' });
});

module.exports = router;
