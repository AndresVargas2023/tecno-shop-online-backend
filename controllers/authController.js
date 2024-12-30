const User = require('../models/User');
const sendVerificationEmail = require('../utils/emailService'); // Importar la función de correo
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.updateUserPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'La contraseña es obligatoria.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Encriptar la contraseña
    await User.findByIdAndUpdate(id, { password: hashedPassword });
    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la contraseña.' });
  }
};
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

    // Enviar el correo de verificación, pasando también el nombre y apellido
    await sendVerificationEmail(email, verificationCode, name, surname);

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

    // Generar el token, incluyendo el rol y el ID del usuario
    const token = jwt.sign(
      { userId: user._id, name: user.name, surname: user.surname, role: user.role },  // Incluye el rol y userId
      'secretKey', { expiresIn: '1h' }
    );

    // Responder con el token, el rol, el userId y el nombre del usuario
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      role: user.role,  // Enviar el rol como parte de la respuesta
      userId: user._id,  // Enviar el userId como parte de la respuesta
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
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar el token de restablecimiento de contraseña
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Guardar el token y la fecha de expiración en el modelo User
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Expiración en 1 hora
    await user.save();

    // Enviar el correo con el enlace para restablecer la contraseña
    await sendVerificationEmail(
      email,
      resetToken,  // Pasa el token al enlace de restablecimiento
      user.name,
      user.surname,
      true  // Indicar que es para recuperación de contraseña
    );

    res.status(200).json({ message: 'Correo de recuperación enviado con el enlace' });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
};

// Restablecer la contraseña y permitir inicio de sesión automático
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Encontrar al usuario con el token de restablecimiento
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }

    // Verificar el token de forma adicional (opcional, dependiendo del flujo)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.userId !== user._id.toString()) {
      return res.status(400).json({ message: 'Token no válido para este usuario.' });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña del usuario
    user.password = hashedPassword;

    // Limpiar el token de restablecimiento y la fecha de expiración
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Guardar el usuario con la nueva contraseña y token de restablecimiento limpiado
    await user.save();

    // Generar un token JWT para iniciar sesión automáticamente
    const newToken = jwt.sign(
      { id: user._id, role: user.role, name: user.name, surname: user.surname },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // El token tiene una validez de 1 hora
    );

    // Responder con el nuevo token y un mensaje de éxito
    res.status(200).json({
      message: 'Contraseña restablecida exitosamente. Te has iniciado sesión automáticamente.',
      token: newToken, // El token para iniciar sesión automáticamente
      role: user.role,
      name: user.name,
      surname: user.surname,
      userId: user._id, // Incluir el ID del usuario
    });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Hubo un error al restablecer la contraseña' });
  }
};



// Verificación de usuario con enlace
exports.verifyUserByLink = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el usuario ya está verificado
    if (user.isVerified) {
      // Si ya está verificado, no necesitamos hacer más, solo enviamos un mensaje
      return res.status(200).json({
        success: true,
        message: 'Usuario ya verificado. Por favor, inicia sesión.',
      });
    }

    // Si el usuario no está verificado, marcarlo como verificado
    user.isVerified = true;
    await user.save();

    // Generar un token para iniciar sesión automáticamente
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, surname: user.surname },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }  // El token tiene una validez de 1 hora
    );

    // Devolver el token, el ID y la información del usuario para iniciar sesión automáticamente
    res.status(200).json({
      success: true,
      message: 'Usuario verificado con éxito. Iniciando sesión automáticamente.',
      token,
      role: user.role,
      name: user.name,
      surname: user.surname,
      userId: user._id // Agregar el ID del usuario
    });

  } catch (error) {
    console.error('Error al verificar el usuario:', error);
    res.status(500).json({ message: 'Error al verificar el usuario' });
  }
};
