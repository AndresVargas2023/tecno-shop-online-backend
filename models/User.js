const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false, // Por defecto no está verificado
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'], // Solo permite estos tres roles
    default: 'user', // Valor predeterminado es 'user'
  },
  address: {
    type: String,
    default: '', // Valor por defecto vacío, puede ser opcional
  },
  // Campos para la recuperación de la contraseña
  resetPasswordToken: {
    type: String, // Token único generado para la recuperación
    default: null,
  },
  resetPasswordExpires: {
    type: Date, // Fecha de expiración del token
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
