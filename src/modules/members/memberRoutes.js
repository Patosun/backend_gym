const express = require('express');
const memberController = require('./memberController');
const { authenticateToken, authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Gestión de miembros del gimnasio
 */

// Rutas que requieren autenticación
router.use(authenticateToken);

// GET /api/members - Obtener todos los miembros
router.get('/', authorize(['ADMIN', 'EMPLOYEE']), memberController.getAllMembers);

// POST /api/members - Crear nuevo miembro
router.post('/', authorize(['ADMIN', 'EMPLOYEE']), memberController.createMember);

// GET /api/members/stats - Estadísticas de miembros
router.get('/stats', authorize(['ADMIN', 'EMPLOYEE']), memberController.getMemberStats);

// GET /api/members/qr/:qrCode - Obtener miembro por QR
router.get('/qr/:qrCode', memberController.getMemberByQR);

// GET /api/members/user/:userId - Obtener miembro por userId
router.get('/user/:userId', memberController.getMemberByUserId);

// GET /api/members/:id - Obtener miembro por ID
router.get('/:id', memberController.getMemberById);

// PUT /api/members/:id - Actualizar miembro
router.put('/:id', memberController.updateMember);

// PATCH /api/members/:id/regenerate-qr - Regenerar QR
router.patch('/:id/regenerate-qr', memberController.regenerateQR);

// GET /api/members/:id/membership-status - Estado de membresía
router.get('/:id/membership-status', memberController.getMembershipStatus);

// GET /api/members/:id/checkins - Historial de check-ins
router.get('/:id/checkins', memberController.getMemberCheckins);

module.exports = router;