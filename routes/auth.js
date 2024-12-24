const express = require('express');
const router = express.Router();
const { login, register, getUsers } = require('../controllers/authController');

// Ruta para el registro
router.post('/register', register);

// Ruta para el inicio de sesión
router.post('/login', login);

// Ruta para obtener todos los usuarios
router.get('/users', getUsers);

module.exports = router;
