// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

// Crear una compra
router.post('/', purchaseController.createPurchase);

// Ver compras por cliente
router.get('/:customerId', purchaseController.getPurchasesByCustomer);

// Editar una compra
router.put('/:purchaseId', purchaseController.updatePurchase);

// Eliminar una compra
router.delete('/:purchaseId', purchaseController.deletePurchase);

router.get('/', purchaseController.getAllPurchases);


module.exports = router;
