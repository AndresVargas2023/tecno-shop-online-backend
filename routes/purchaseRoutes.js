// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const auth = require('../middleware/auth'); // Asegúrate de importar el middleware si lo necesitas

// Crear una compra
router.post('/', purchaseController.createPurchase);

// Ver compras por cliente
router.get('/:customerId', purchaseController.getPurchasesByCustomer);

// Editar una compra
router.put('/:purchaseId', purchaseController.updatePurchase);

// Eliminar una compra
router.delete('/:purchaseId', purchaseController.deletePurchase);

router.get('/', purchaseController.getAllPurchases);

router.get('/details/:purchaseId', purchaseController.getPurchaseDetails);


router.put('/update/:purchaseId', auth, purchaseController.editPurchase); // Aplicar el middleware aquí



module.exports = router;
