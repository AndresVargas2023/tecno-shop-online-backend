// controllers/purchaseController.js
const Purchase = require('../models/Purchase');
const Product = require('../models/productModel');  // Asegúrate de importar el modelo de Producto


// Crear una nueva compra
exports.createPurchase = async (req, res) => {
    try {
      const { customerId, products } = req.body;
  
      // Buscar los productos en la base de datos para obtener sus precios
      const productIds = products.map(product => product.productId);
      const existingProducts = await Product.find({ '_id': { $in: productIds } });
  
      // Verificar que todos los productos existen
      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({ error: 'Algunos productos no existen en la base de datos' });
      }
  
      // Calcular el total de la compra usando los precios de los productos existentes
      const total = products.reduce((sum, product) => {
        const productData = existingProducts.find(p => p._id.toString() === product.productId.toString());
        if (productData) {
          return sum + product.quantity * productData.price;  // Usar el precio real del producto
        }
        return sum; // Si no se encuentra el producto, no se suma nada
      }, 0);
  
      // Crear una nueva compra
      const newPurchase = new Purchase({
        customerId,
        products,
        total,
      });
  
      // Guardar la compra en la base de datos
      await newPurchase.save();
  
      // Responder con el éxito de la compra
      res.status(201).json({ message: 'Compra realizada con éxito', purchase: newPurchase });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la compra' });
    }
  };

// Ver compras por cliente
exports.getPurchasesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const purchases = await Purchase.find({ customerId }).populate('products.productId', 'name price');
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las compras' });
  }
};

// Ver todas las compras
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('products.productId', 'name price');
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener todas las compras' });
  }
};

// Editar una compra
exports.updatePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { products } = req.body;

    // Calcular el nuevo total
    const total = products.reduce((sum, product) => sum + product.quantity * product.price, 0);

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      { products, total },
      { new: true }
    );

    if (!updatedPurchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.status(200).json({ message: 'Compra actualizada con éxito', purchase: updatedPurchase });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la compra' });
  }
};

// Eliminar una compra
exports.deletePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const deletedPurchase = await Purchase.findByIdAndDelete(purchaseId);

    if (!deletedPurchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.status(200).json({ message: 'Compra eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la compra' });
  }
};
