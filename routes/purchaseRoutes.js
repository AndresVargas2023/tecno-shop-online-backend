// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const auth = require('../middleware/auth'); // Asegúrate de importar el middleware si lo necesitas

// Crear una compra
router.post('/', purchaseController.createPurchase);

// Ver compras por cliente
router.get('/:customerId', purchaseController.getPurchasesByCustomer);

// Ver todas las compras
router.get('/', purchaseController.getAllPurchases);

// Eliminar una compra
router.delete('/:purchaseId', purchaseController.deletePurchase);

// Detalles de una compra
router.get('/details/:purchaseId', purchaseController.getPurchaseDetails);

// Actualizar una compra
router.put('/update/:purchaseId', auth, purchaseController.editPurchase); // Aplicar el middleware aquí

// Actualizar estado y fecha estimada de entrega de una compra
router.patch('/updateDateStatus/:purchaseId', purchaseController.updatePurchaseStatus);

// Ruta para obtener el resumen de ventas
router.get('/summary', purchaseController.getSalesSummary);

module.exports = router;
