const User = require('../models/User');
const sendVerificationEmail = require('../utils/emailService'); // Importar la función de correo
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Registro de usuario con código de verificación
exports.register = async (req, res) => {
  try {
    const { name, surname, email, password, address } = req.body;

    // Validación de campos obligatorios
    if (!name || !surname || !email || !password || !address) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Validación del formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El correo electrónico no es válido' });
    }

    // Generar código de verificación (numérico de 6 dígitos)
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear y guardar el usuario
    const newUser = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      verificationCode,
      isVerified: false, // Inicialmente no está verificado
      role: 'user', // Asignamos el rol por defecto como 'user'
      address, // Usamos la dirección recibida
    });

    await newUser.save();

    // Enviar el correo de verificación
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'Usuario registrado. Por favor verifica tu correo.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};


// Confirmación de la cuenta con código de verificación
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.verificationCode !== String(code)) {
      return res.status(400).json({
        message: 'Código de verificación incorrecto',
        expected: user.verificationCode,
        received: code,
      });
    }

    // Actualizar el estado de verificación
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Correo verificado con éxito' });
  } catch (error) {
    console.error('Error al verificar correo:', error);
    res.status(500).json({ message: 'Error al verificar correo' });
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar el usuario por correo electrónico
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    // Generar el token, incluyendo el rol del usuario
    const token = jwt.sign(
      { userId: user._id, name: user.name, surname: user.surname, role: user.role },  // Incluye el rol
      'secretKey', { expiresIn: '1h' }
    );

    // Responder con el token y el rol
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      role: user.role,  // Enviar el rol como parte de la respuesta
      name: user.name,
      surname: user.surname,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0, verificationCode: 0 }); // Excluir campos sensibles
    res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Eliminar usuario por ID
exports.deleteUser = async (req, res) => {
  const { userId } = req.params; // El ID del usuario que se quiere eliminar

  try {
    // Buscar y eliminar el usuario por su ID
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};

// Editar usuario por ID
exports.editUser = async (req, res) => {
  const { userId } = req.params; // El ID del usuario que se quiere editar
  const { name, surname, email, password, role, address } = req.body; // Los campos a editar

  try {
    // Buscar el usuario por ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar los campos del usuario
    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10); // Si se pasa una nueva contraseña, se encripta
    if (role) user.role = role;
    if (address !== undefined) user.address = address; // Puede ser vacío o una dirección

    await user.save(); // Guardamos los cambios

    res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al editar el usuario:', error);
    res.status(500).json({ message: 'Error al editar el usuario' });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params; // Obtenemos el ID del usuario desde los parámetros de la URL

  try {
    // Buscar el usuario por ID
    const user = await User.findById(userId).select('-password -verificationCode'); // Excluir los campos sensibles

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Devolver los datos del usuario
    res.status(200).json({
      name: user.name,
      surname: user.surname,
      email: user.email,
      address: user.address || 'No disponible',
      role: user.role || 'No asignado',
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};

// Solicitar recuperación de contraseña
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar un token único (código de verificación)
    const resetToken = Math.floor(100000 + Math.random() * 900000); // Genera un número aleatorio de 6 dígitos

    const tokenExpiration = Date.now() + 3600000; // 1 hora de validez

    // Guardar el token y su expiración en el usuario
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiration;
    await user.save();

    // Enviar el token por correo
    const resetURL = `https://tecnoshoponline.netlify.app/forgot-password/${resetToken}`;
    
    // Aquí es donde el código de verificación se pasa al correo
    await sendVerificationEmail(
      email,
      resetToken,
      true  // Indicamos que es para recuperación de contraseña
    );

    res.status(200).json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
};

// En tu archivo de controlador (authController.js)
exports.verifyPasswordResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.resetPasswordToken !== code || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    res.status(200).json({ message: 'Código verificado. Puedes restablecer tu contraseña.' });
  } catch (error) {
    console.error('Error al verificar el código:', error);
    res.status(500).json({ message: 'Error al verificar el código' });
  }
};



exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body; // El token se obtiene del cuerpo de la solicitud

  try {
    // Verificar si el token es válido
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Código de recuperación inválido o expirado' });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);  // Generar un "salt"
    const hashedPassword = await bcrypt.hash(newPassword, salt);  // Encriptar la nueva contraseña

    // Actualizar la contraseña del usuario con la versión encriptada
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;  // Limpiar el token de recuperación
    user.resetPasswordExpires = undefined;  // Limpiar la expiración del token

    await user.save();  // Guardar la nueva contraseña en la base de datos

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Hubo un error al restablecer la contraseña' });
  }
};