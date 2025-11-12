const express = require('express');
const userController = require('./userController');
const { authenticateToken, authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios del sistema
 */

// Rutas que requieren autenticación
router.use(authenticateToken);

// GET /api/users - Obtener todos los usuarios
router.get('/', authorize(['ADMIN', 'EMPLOYEE']), userController.getAllUsers);

// GET /api/users/stats - Estadísticas de usuarios
router.get('/stats', authorize(['ADMIN', 'EMPLOYEE']), userController.getUserStats);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', userController.updateUser);

// PATCH /api/users/:id/deactivate - Desactivar usuario
router.patch('/:id/deactivate', authorize(['ADMIN']), userController.deactivateUser);

// PATCH /api/users/:id/activate - Activar usuario
router.patch('/:id/activate', authorize(['ADMIN']), userController.activateUser);

// PATCH /api/users/:id/change-password - Cambiar contraseña
router.patch('/:id/change-password', userController.changePassword);

module.exports = router;