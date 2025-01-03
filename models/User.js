const mongoose = require('mongoose');
const validator = require('validator'); // Para validar el formato de email
const bcrypt = require('bcryptjs'); // Para encriptar la contraseña

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
    unique: true, // Asegura que el correo sea único
    validate: {
      validator: (value) => validator.isEmail(value), // Validación de formato de correo
      message: 'Por favor ingresa un correo electrónico válido',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Mínimo 6 caracteres
    validate: {
      validator: (value) => /[a-zA-Z]/.test(value) && /\d/.test(value), // Contraseña debe contener al menos una letra y un número
      message: 'La contraseña debe tener al menos 6 caracteres y contener al menos una letra y un número',
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
  dpt: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  barrio: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: (value) => /\d{10}/.test(value), // Asegura que el teléfono tenga 10 dígitos (puedes modificar esto según el formato que desees)
      message: 'El número de teléfono debe tener 10 dígitos',
    },
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});

// Encriptación de la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10); // Encriptamos la contraseña antes de guardarla
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
