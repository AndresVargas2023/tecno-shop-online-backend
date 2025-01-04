// controllers/purchaseController.js
const Purchase = require('../models/Purchase');
const Product = require('../models/productModel');  // Asegúrate de importar el modelo de Producto

exports.createPurchase = async (req, res) => {
  try {
    const { customerId, products, status, deliveryDate, reference, observations, shippingInfo, referenceNumber } = req.body;
    
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
      status: status || 'pendiente',  // Por defecto la compra está pendiente
      deliveryDate,
      reference: reference || `REF-${Date.now()}`,  // Genera una referencia basada en la fecha
      referenceNumber: referenceNumber || `REF-${Date.now()}`,  // Asignar referencia por defecto
      shippingInfo: {
        reference: shippingInfo?.referencia || `Ref-${Date.now()}`,  // Usar shippingInfo.referencia (no reference)
        ...shippingInfo  // Incluir el resto de la información de envío
      },
      observations,
      history: [{ action: 'Compra realizada', date: new Date(), status: 'pendiente' }]  // Añadir 'status' al historial
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
    const { products, status, deliveryDate, reference, observations } = req.body;

    // Calcular el nuevo total
    const total = products.reduce((sum, product) => sum + product.quantity * product.price, 0);

    // Buscar la compra para asegurarse de que existe
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // Actualizar el historial de cambios
    const historyUpdate = {
      action: 'Compra actualizada',
      date: new Date(),
      changes: {
        status: status || purchase.status,
        deliveryDate: deliveryDate || purchase.deliveryDate,
        reference: reference || purchase.reference,
        observations: observations || purchase.observations
      }
    };

    // Actualizar la compra
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      {
        products,
        total,
        status,
        deliveryDate,
        reference,
        observations,
        $push: { history: historyUpdate },  // Agregar al historial
      },
      { new: true }
    );

    res.status(200).json({ message: 'Compra actualizada con éxito', purchase: updatedPurchase });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la compra' });
  }
};
