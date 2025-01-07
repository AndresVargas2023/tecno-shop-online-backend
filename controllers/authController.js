const User = require('../models/User');
const sendVerificationEmail = require('../utils/emailService'); // Importar la función de correo
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Registro de usuario con código de verificación
exports.register = async (req, res) => {
  try {
    const { name, surname, email, password, dpt, city, barrio, phoneNumber } = req.body;

    // Crear y guardar el usuario
    const newUser = new User({
      name,
      surname,
      email,
      password,
      dpt,
      city,
      barrio,
      phoneNumber,
    });

    await newUser.save();

    // Enviar el correo de verificación
    await sendVerificationEmail(email, name, surname);

    res.status(201).json({ message: 'Usuario registrado. Por favor verifica tu correo.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);

    // Manejo de error de clave duplicada (correo duplicado)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'El correo electrónico ya está registrado. Por favor, utiliza otro.',
      });
    }

    // Si es otro tipo de error, enviar un error genérico
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }

    res.status(500).json({ error: 'Error al registrar usuario.' });
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
      { id: user._id, role: user.role, name: user.name, surname: user.surname, dpt: user.dpt, city: user.city, barrio: user.barrio, phoneNumber: user.phoneNumber },
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
      userId: user._id,
      dpt: user.dpt, 
      city: user.city, 
      barrio: user.barrio, 
      phoneNumber: user.phoneNumber
    });

  } catch (error) {
    console.error('Error al verificar el usuario:', error);
    res.status(500).json({ message: 'Error al verificar el usuario' });
  }
};

// Inicio de Sesión
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar el usuario por correo electrónico
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'El correo electrónico no está registrado.' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    // Generar el token, incluyendo el rol y el ID del usuario
    const token = jwt.sign(
      { 
        userId: user._id, 
        name: user.name, 
        surname: user.surname, 
        email: user.email,  // Añadir email al token
        role: user.role,
        dpt: user.dpt, 
        city: user.city, 
        barrio: user.barrio, 
        phoneNumber: user.phoneNumber  // Añadir teléfono al token
      },
      process.env.JWT_SECRET, { expiresIn: '1h' }
    );

    // Imprimir el token en la consola del servidor
    console.log('Token generado:', token);  // Esto imprimirá el token en la consola de VSCode

    // Responder con el token y todos los datos del usuario
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        userId: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        dpt: user.dpt,
        city: user.city,
        barrio: user.barrio,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};



// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0}); // Excluir campos sensibles
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
  const { name, surname, email, password, role, dpt, city, barrio, phoneNumber } = req.body; // Los campos a editar

  try {
    // Buscar el usuario por ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el campo de email está intentando modificarse y evitarlo
    if (email && email !== user.email) {
      return res.status(400).json({ message: 'No se puede modificar el correo electrónico' });
    }

    // Actualizar los campos del usuario
    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (role) user.role = role;
    if (dpt !== undefined) user.dpt = dpt; // Departamento
    if (city !== undefined) user.city = city; // Ciudad
    if (barrio !== undefined) user.barrio = barrio; // Barrio
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber; // Número de teléfono
    if (password) user.password = await bcrypt.hash(password, 10); // Si se pasa una nueva contraseña, se encripta

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
    // Buscar el usuario por ID y seleccionar todos los campos necesarios
    const user = await User.findById(userId).select('-password -verificationCode'); // Excluir los campos sensibles

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Devolver los datos del usuario, incluyendo los campos adicionales
    res.status(200).json({
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role || 'No asignado',
      isVerified: user.isVerified,
      dpt: user.dpt || 'No disponible',  // Asegúrate de que el campo 'dpt' existe en el modelo
      city: user.city || 'No disponible',     // Asegúrate de que el campo 'city' existe en el modelo
      barrio: user.barrio || 'No disponible', // Asegúrate de que el campo 'barrio' existe en el modelo
      phoneNumber: user.phoneNumber || 'No disponible', // Asegúrate de que el campo 'phoneNumber' existe en el modelo
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


// Verificar el token del enlace y permitir que el usuario ingrese una nueva contraseña
exports.verifyLink = async (req, res) => {
  const { token } = req.params;

  try {
    // Buscar al usuario con el token de recuperación de contraseña
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    

    if (!user) {
      return res.status(400).json({ message: "Token inválido o ha expirado." });
    }

    // Si el token es válido, responder con un mensaje
    res.status(200).json({ message: "Token verificado. Puedes cambiar tu contraseña." });
  } catch (error) {
    console.error("Error al verificar el token:", error.message);
    res.status(500).json({ message: "Error al verificar el token." });
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


// Función para actualizar la contraseña
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