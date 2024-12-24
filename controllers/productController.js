const Product = require('../models/productModel');

// Obtener todos los productos o filtrar por categoría
const getProducts = async (req, res) => {
  try {
    const { category } = req.query; // Obtener la categoría desde los parámetros de la consulta

    let products;
    if (category) {
      // Si se pasa una categoría, filtrar los productos por esa categoría
      products = await Product.find({ category });
    } else {
      // Si no se pasa una categoría, obtener todos los productos
      products = await Product.find();
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
};

// Obtener un producto por su ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del producto
    const product = await Product.findById(id); // Buscar el producto por ID

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product); // Devolver el producto encontrado
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

// Crear un nuevo producto
const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;
    const newProduct = new Product({ name, price, description, image, category });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el producto' });
  }
};

// Modificar un producto
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del producto a actualizar
    const { name, price, description, image, category } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      { name, price, description, image, category },
      { new: true } // Devuelve el documento actualizado
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto' });
  }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del producto a eliminar

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
