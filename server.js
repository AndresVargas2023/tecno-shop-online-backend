require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Importa Helmet
const connectDB = require('./config/db'); // Verifica que la ruta sea correcta
const authRoutes = require('./routes/auth');
const products = require('./routes/products'); // Asegúrate de que la ruta sea correcta

const app = express();

// Conexión a la base de datos
connectDB();

// Middlewares
app.use(cors({
  origin: '*',
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Métodos permitidos
  credentials: true // Si necesitas enviar cookies o headers de autenticación
}));
app.use(express.json());

// Configuración de Content Security Policy con Helmet
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
      // Agrega otras configuraciones según tus necesidades
    },
  })
);

// Rutas
app.use('/api/auth', authRoutes); // Asegúrate de que esta ruta esté configurada correctamente
app.use('/api/products', products); // Rutas de productos

// Puerto del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
