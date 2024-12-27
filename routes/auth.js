const express = require('express');
const router = express.Router();
const { 
    register, 
    verifyEmail, 
    login, 
    getUsers, 
    deleteUser, 
    editUser, 
    getUserById,
    requestPasswordReset,  // Nueva función
    resetPassword,         // Nueva función
    verifyPasswordResetCode // Nueva función para verificar código de recuperación
} = require('../controllers/authController');

// Registrar usuario
router.post('/register', register);

// Verificar correo electrónico
router.post('/verify', verifyEmail);

// Iniciar sesión
router.post('/login', login);

// Ruta para solicitar recuperación de contraseña
router.post('/request-password-reset', requestPasswordReset);

// Ruta para verificar el código de recuperación de contraseña
router.post('/verify-password-reset-code', verifyPasswordResetCode);

// Ruta para restablecer la contraseña
router.post('/reset-password', resetPassword);

// Obtener usuarios
router.get('/users', getUsers);

// Obtener usuario por ID
router.get('/users/:userId', getUserById);

// Eliminar usuario por Id
router.delete('/users/:userId', deleteUser);

// Editar usuario
router.put('/users/:userId', editUser);

module.exports = router;
