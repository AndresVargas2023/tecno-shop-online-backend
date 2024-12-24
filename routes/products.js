const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

// Rutas de productos
router.get('/', getProducts); // Obtener todos los productos
router.get('/:id', getProductById); // Obtener un producto por ID
router.post('/', createProduct); // Crear un nuevo producto
router.put('/:id', updateProduct); // Actualizar un producto por ID
router.delete('/:id', deleteProduct); // Eliminar un producto por ID

module.exports = router;  // Exporta las rutas
