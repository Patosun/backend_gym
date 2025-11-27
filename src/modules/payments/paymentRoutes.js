const express = require('express');
const paymentController = require('./paymentController');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestión de pagos y transacciones
 */

// Rutas que requieren autenticación
router.use(authenticateToken);

// GET /api/payments/stats - Estadísticas de pagos
router.get('/stats', authorize(['ADMIN', 'EMPLOYEE']), paymentController.getPaymentStats);

// GET /api/payments/pending - Pagos pendientes
router.get('/pending', authorize(['ADMIN', 'EMPLOYEE']), paymentController.getPendingPayments);

// GET /api/payments/member/:memberId - Pagos por miembro
router.get('/member/:memberId', paymentController.getPaymentsByMember);

// GET /api/payments - Obtener todos los pagos
router.get('/', authorize(['ADMIN', 'EMPLOYEE']), paymentController.getAllPayments);

// POST /api/payments - Crear nuevo pago
router.post('/', authorize(['ADMIN', 'EMPLOYEE']), paymentController.createPayment);

// GET /api/payments/:id - Obtener pago por ID
router.get('/:id', paymentController.getPaymentById);

// PUT /api/payments/:id - Actualizar pago
router.put('/:id', authorize(['ADMIN', 'EMPLOYEE']), paymentController.updatePayment);

// PATCH /api/payments/:id/confirm - Confirmar pago pendiente
router.patch('/:id/confirm', authorize(['ADMIN', 'EMPLOYEE']), paymentController.confirmPayment);

// PATCH /api/payments/:id/cancel - Cancelar pago
router.patch('/:id/cancel', authorize(['ADMIN', 'EMPLOYEE']), paymentController.cancelPayment);

module.exports = router;