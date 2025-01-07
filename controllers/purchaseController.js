// controllers/purchaseController.js
const Purchase = require('../models/Purchase');
const Product = require('../models/productModel');  // Asegúrate de importar el modelo de Producto
const mongoose = require('mongoose'); // Importa mongoose


exports.createPurchase = async (req, res) => {
  try {
    const { 
      customerId, 
      products, 
      status, 
      deliveryDate, 
      shippingInfo, 
      referenceNumber 
    } = req.body;

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
      referenceNumber: referenceNumber || `REF-${Date.now()}`,  // Asignar referencia por defecto
      shippingInfo: {
        address: shippingInfo?.address || 'Dirección no especificada', // Añadir la dirección con un valor por defecto
        reference: shippingInfo?.reference || `Referencia no especificada`, // Usar shippingInfo.reference
        observations: shippingInfo?.observations || '', // Observaciones opcionales
      },
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
exports.getPurchaseDetails = async (req, res) => {
  const { purchaseId } = req.params;

  // Validar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
    return res.status(400).json({ message: 'ID de compra no válido' });
  }

  try {
    // Buscar la compra por el ID y poblar los productos con su información completa
    const purchase = await Purchase.findById(purchaseId)
      .populate('products.productId'); // Poblamos la referencia 'productId' en 'products'

    // Si no se encuentra la compra
    if (!purchase) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    // Devolver los detalles de la compra
    res.json(purchase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.editPurchase = async (req, res) => {
  const { purchaseId } = req.params;
  const { userId } = req.user;  // Aquí accedemos correctamente al userId desde req.user
  console.log("ID de la compra recibido en el backend:", purchaseId);

  const { products, status, estimatedDeliveryDate, shippingInfo, referenceNumber } = req.body;

  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // Validar que la compra pertenece al usuario que realiza la solicitud
    if (purchase.customerId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta compra' });
    }

    // Actualizar productos si se proporcionaron
    if (products) {
      const productIds = products.map(product => product.productId);
      const existingProducts = await Product.find({ '_id': { $in: productIds } });

      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({ error: 'Algunos productos no existen en la base de datos' });
      }

      const total = products.reduce((sum, product) => {
        const productData = existingProducts.find(p => p._id.toString() === product.productId.toString());
        return productData ? sum + product.quantity * productData.price : sum;
      }, 0);

      purchase.products = products.map(product => ({
        ...product,
        price: existingProducts.find(p => p._id.toString() === product.productId.toString())?.price || 0,
      }));
      purchase.total = total;
    }

    // Actualizar campos opcionales
    if (status) purchase.status = status;
    if (estimatedDeliveryDate) purchase.estimatedDeliveryDate = estimatedDeliveryDate;
    if (shippingInfo) {
      purchase.shippingInfo = {
        ...purchase.shippingInfo,
        ...shippingInfo,
      };
    }
    if (referenceNumber) purchase.referenceNumber = referenceNumber;

    // Registrar cambios en el historial
    purchase.history.push({
      status: purchase.status,
      date: new Date(),
      note: 'Edición realizada por el usuario',
    });

    // Guardar los cambios
    await purchase.save();

    res.status(200).json({ message: 'Compra actualizada con éxito', purchase });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la compra' });
  }
};

exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { status, estimatedDeliveryDate } = req.body;

    // Actualizar el estado y la fecha estimada de entrega de la compra
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      { status, estimatedDeliveryDate },
      { new: true } // Devuelve el documento actualizado
    ).populate('products.productId', 'name price');

    if (!updatedPurchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.status(200).json(updatedPurchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado de la compra' });
  }
};


// Obtener resumen de ventas
exports.getSalesSummary = async (req, res) => {
  try {
    const salesSummary = await Purchase.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: null,
          totalProductsSold: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
          productsSold: {
            $push: {
              productId: '$products.productId',
              quantity: '$products.quantity',
              price: '$products.price',
              total: { $multiply: ['$products.price', '$products.quantity'] },
            },
          },
          ordersByStatus: {
            $push: {
              status: '$status',
              createdAt: '$createdAt',
            },
          },
        },
      },
      {
        $project: {
          totalProductsSold: 1,
          totalRevenue: 1,
          productsSold: 1,
          ordersByStatus: 1,
        },
      },
    ]);

    // Responder con el resultado o valores predeterminados
    res.json(salesSummary[0] || { totalProductsSold: 0, totalRevenue: 0, productsSold: [], ordersByStatus: [] });
  } catch (err) {
    // Manejar errores
    console.error(err);
    res.status(500).json({ message: 'Error al obtener el resumen de ventas' });
  }
};