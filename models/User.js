const mongoose = require('mongoose');

// Esquema del usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // ¡Recuerda encriptar las contraseñas!
});

// Middleware para ejecutar después de guardar un usuario
userSchema.post('save', function (doc) {
  console.log(`Usuario guardado: ${JSON.stringify(doc)}`);
});

// Exportar el modelo
module.exports = mongoose.model('User', userSchema);
