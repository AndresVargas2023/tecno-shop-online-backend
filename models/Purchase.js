const mongoose = require('mongoose');

// Subdocumento para el historial de cambios
const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
});

// Esquema principal de compra
const purchaseSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia al usuario
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  shippingInfo: {
    reference: { type: String, required: true }, // Referencia del lugar de entrega
    observations: { type: String }, // Observaciones del lugar de entrega
  },
  status: {
    type: String,
    required: true,
    default: 'pendiente',
    enum: ['pendiente', 'confirmado', 'en camino', 'completada', 'cancelada'], // Estados de la compra
  },
  shippingDate: { type: Date }, // Fecha en la que se envió el producto
  estimatedDeliveryDate: { type: Date }, // Fecha estimada de entrega
  referenceNumber: { type: String, unique: true, required: true }, // Referencia única para la compra
  history: [historySchema], // Historial de cambios
  createdAt: { type: Date, default: Date.now }, // Fecha de creación de la compra
});

module.exports = mongoose.model('Purchase', purchaseSchema);