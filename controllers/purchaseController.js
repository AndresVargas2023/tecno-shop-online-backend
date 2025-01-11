// controllers/purchaseController.js
const Purchase = require('../models/Purchase');
const Product = require('../models/productModel');  // Asegúrate de importar el modelo de Producto
const User = require('../models/User');  // Asegúrate de importar el modelo de Producto

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

    // Buscar los productos en la base de datos para obtener sus precios y nombres
    const productIds = products.map(product => product.productId);
    const existingProducts = await Product.find({ '_id': { $in: productIds } });

    // Verificar que todos los productos existen
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ error: 'Algunos productos no existen en la base de datos' });
    }

    // Crear la lista de productos con los datos adicionales (nombre y precio)
    const updatedProducts = products.map(product => {
      const productData = existingProducts.find(p => p._id.toString() === product.productId.toString());
      if (productData) {
        return {
          productId: productData._id,
          productName: productData.name, // Nombre del producto desde la base de datos
          productPrice: productData.price, // Precio del producto desde la base de datos
          quantity: product.quantity,
          totalPrice: product.quantity * productData.price // Precio total del producto
        };
      }
      return null; // Si no se encuentra el producto, devolver null
    });

    // Verificar que no hay productos nulos en la lista
    if (updatedProducts.includes(null)) {
      return res.status(400).json({ error: 'Error al procesar algunos productos' });
    }

    // Calcular el total de la compra
    const total = updatedProducts.reduce((sum, product) => sum + product.totalPrice, 0);

    // Crear una nueva compra
    const newPurchase = new Purchase({
      customerId,
      products: updatedProducts, // Lista de productos actualizada con nombre y precio
      total,
      status: status || 'pendiente', // Por defecto la compra está pendiente
      deliveryDate,
      referenceNumber: referenceNumber || `REF-${Date.now()}`, // Asignar referencia por defecto
      shippingInfo: {
        address: shippingInfo?.address || 'Dirección no especificada', // Dirección con valor por defecto
        reference: shippingInfo?.reference || 'Referencia no especificada', // Referencia con valor por defecto
        observations: shippingInfo?.observations || '', // Observaciones opcionales
      },
      history: [{ action: 'Compra realizada', date: new Date(), status: 'pendiente' }] // Historial inicial
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

    // Encuentra las compras del cliente sin necesidad de 'populate'
    const purchases = await Purchase.find({ customerId });

    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las compras' });
  }
};

// Ver todas las compras
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('customerId', 'name surname') // Sigue poblando para obtener nombre y apellido del cliente
      .exec(); // Ejecuta la consulta

    res.status(200).json(purchases); // Devuelve las compras
  } catch (error) {
    console.error(error); // Detalle del error para depuración
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

// Ver la compras en detalles a su ID
exports.getPurchaseDetails = async (req, res) => {
  const { purchaseId } = req.params;

  // Validar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
    return res.status(400).json({ message: 'ID de compra no válido' });
  }

  try {
    // Buscar la compra por el ID sin utilizar populate
    const purchase = await Purchase.findById(purchaseId);

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
  console.log("Usuario autenticado:", req.user);

  const { products, status, estimatedDeliveryDate, shippingInfo, referenceNumber } = req.body;

  console.log("Datos recibidos en el cuerpo de la solicitud:", req.body);

  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // Validar que la compra pertenece al usuario que realiza la solicitud
    if (purchase.customerId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta compra' });
    }

    // Validar productos
    if (products) {
      console.log("Productos recibidos:", products);
      const productIds = products.map(product => product.productId);
      console.log("Ids de productos:", productIds);

      const existingProducts = await Product.find({ '_id': { $in: productIds } });

      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({ error: 'Algunos productos no existen en la base de datos' });
      }

      const total = products.reduce((sum, product) => {
        const productData = existingProducts.find(p => p._id.toString() === product.productId.toString());
        console.log("Producto encontrado:", productData);
        return productData ? sum + product.quantity * productData.price : sum;
      }, 0);
      console.log("Total calculado:", total);

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
    console.error("Error al actualizar la compra:", error);
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
    )

    if (!updatedPurchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.status(200).json(updatedPurchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado de la compra' });
  }
};


/// Obtener resumen de ventas
exports.getSalesSummary = async (req, res) => {
  try {
    const salesSummary = await Purchase.aggregate([
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',  // Nombre de la colección de productos
          localField: 'products.productId',  // Campo que contiene el ID del producto en la venta
          foreignField: '_id',  // Campo en el modelo de productos que corresponde al ID
          as: 'productDetails',  // Nuevo campo donde agregaremos los detalles del producto
        },
      },
      { $unwind: '$productDetails' },  // Desglosamos el array productDetails para acceder a los campos directamente
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalProductsSold: { $sum: { $toInt: '$products.quantity' } },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $toInt: '$products.price' },
                { $toInt: '$products.quantity' },
              ],
            },
          },
          productsSold: {
            $push: {
              productId: '$products.productId',
              quantity: { $toInt: '$products.quantity' },
              price: { $toInt: '$products.price' },
              total: {
                $multiply: [
                  { $toInt: '$products.price' },
                  { $toInt: '$products.quantity' },
                ],
              },
              name: '$productDetails.name',  // Incluir el nombre del producto
              image: '$productDetails.image',  // Incluir la imagen del producto
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
          yearMonth: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
          totalProductsSold: 1,
          totalRevenue: 1,
          productsSold: 1,
          ordersByStatus: 1,
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }, // Para ordenar las ventas por año y mes
    ]);

    // Agregar la parte que agrupa las cantidades por producto
    salesSummary.forEach((summary) => {
      const groupedProducts = {};

      // Agrupar por productId
      summary.productsSold.forEach((product) => {
        if (groupedProducts[product.productId]) {
          groupedProducts[product.productId].quantity += product.quantity;
        } else {
          groupedProducts[product.productId] = { ...product };
        }
      });

      // Volver a convertir el objeto a un array
      summary.productsSold = Object.values(groupedProducts);
    });

    res.json(salesSummary);
  } catch (err) {
    console.error('Error al obtener el resumen de ventas:', err);
    res.status(500).json({ message: 'Error al obtener el resumen de ventas' });
  }
};
