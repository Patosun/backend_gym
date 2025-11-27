const express = require('express');
const membershipController = require('./membershipController');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');
const { audit } = require('../../middlewares/audit');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Memberships
 *   description: Gestión de membresías y tipos de membresía
 */

// Rutas que requieren autenticación
router.use(authenticateToken);

// ===== MEMBERSHIP TYPES =====
// GET /api/memberships/types - Obtener todos los tipos de membresía
router.get('/types', membershipController.getAllMembershipTypes);

// POST /api/memberships/types - Crear nuevo tipo de membresía
router.post('/types', authorize(['ADMIN']), membershipController.createMembershipType);

// GET /api/memberships/types/:id - Obtener tipo de membresía por ID
router.get('/types/:id', membershipController.getMembershipTypeById);

// PUT /api/memberships/types/:id - Actualizar tipo de membresía
router.put('/types/:id', authorize(['ADMIN']), membershipController.updateMembershipType);

// ===== MEMBERSHIPS =====
// GET /api/memberships/stats - Estadísticas de membresías
router.get('/stats', authorize(['ADMIN', 'EMPLOYEE']), membershipController.getMembershipStats);

// GET /api/memberships/expiring - Membresías próximas a expirar
router.get('/expiring', authorize(['ADMIN', 'EMPLOYEE']), membershipController.getExpiringMemberships);

// GET /api/memberships - Obtener todas las membresías
router.get('/', authorize(['ADMIN', 'EMPLOYEE']), membershipController.getAllMemberships);

// POST /api/memberships - Crear nueva membresía
router.post('/', authorize(['ADMIN', 'EMPLOYEE']), membershipController.createMembership);

// GET /api/memberships/:id - Obtener membresía por ID
router.get('/:id', membershipController.getMembershipById);

// PUT /api/memberships/:id - Actualizar membresía
router.put('/:id', authorize(['ADMIN', 'EMPLOYEE']), membershipController.updateMembership);

// PATCH /api/memberships/:id/extend - Extender membresía
router.patch('/:id/extend', authorize(['ADMIN', 'EMPLOYEE']), membershipController.extendMembership);

module.exports = router;