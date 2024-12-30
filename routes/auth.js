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
    updateUserPassword,
    verifyLink,  // Nueva ruta para verificar el enlace para recuperar contraseña
    verifyUserByLink
} = require('../controllers/authController');

// Registrar usuario
router.post('/register', register);

// Verificar correo electrónico
router.post('/verify', verifyEmail);

// Iniciar sesión
router.post('/login', login);

// Ruta para solicitar recuperación de contraseña
router.post('/request-password-reset', requestPasswordReset);

// Ruta para verificar el enlace de recuperación de contraseña
router.get('/verify-link/:token', verifyLink);  // Cambié a GET para coincidir con la ruta de verificación del token

router.post('/verify-link', verifyUserByLink);


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

// Actualizar la contraseña de un usuario por su ID
router.patch('/users/:id/password', updateUserPassword);

module.exports = router;
