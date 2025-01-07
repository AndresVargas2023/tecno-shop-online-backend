const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Obtener el token del encabezado Authorization
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  console.log('Token recibido:', token); // Mostrar el token recibido para depuración

  if (!token) {
    console.log('No se proporcionó un token.');
    return res.status(401).json({ message: 'Acceso no autorizado: Token faltante' });
  }

  try {
    // Verificar y decodificar el token usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Token decodificado:', decoded); // Mostrar la información decodificada del token

    // Guardar los datos del usuario en la solicitud para acceder a ellos en las rutas
    req.user = decoded;
    
    // Continuar con la ejecución de la siguiente función de middleware o ruta
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err); // Mostrar el error si la verificación falla
    res.status(401).json({ message: 'Token no válido o expirado' });
  }
};

module.exports = auth;
