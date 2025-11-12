const express = require('express');
const branchController = require('./branchController');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');
const {
  branchCreateSchema,
  branchUpdateSchema,
  idParamSchema,
  paginationSchema,
  dateRangeSchema
} = require('../../utils/zodSchemas');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Branch:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *         - state
 *         - openingTime
 *         - closingTime
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         isActive:
 *           type: boolean
 *         openingTime:
 *           type: string
 *           example: "06:00"
 *         closingTime:
 *           type: string
 *           example: "23:00"
 */

/**
 * @swagger
 * /api/branches/nearby:
 *   get:
 *     summary: Obtener sucursales cercanas
 *     tags: [Branches]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Ciudad
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Estado
 *     responses:
 *       200:
 *         description: Lista de sucursales cercanas
 */
router.get('/nearby', branchController.getNearbyBranches);

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Crear nueva sucursal
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Branch'
 *     responses:
 *       201:
 *         description: Sucursal creada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.post('/', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(branchCreateSchema), 
  branchController.createBranch
);

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: Obtener todas las sucursales
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Elementos por página
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtrar por ciudad
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de sucursales
 */
router.get('/', 
  authenticateToken, 
  validateSchema(paginationSchema, 'query'), 
  branchController.getAllBranches
);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Obtener sucursal por ID
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sucursal
 *     responses:
 *       200:
 *         description: Datos de la sucursal
 *       404:
 *         description: Sucursal no encontrada
 */
router.get('/:id', 
  authenticateToken, 
  validateSchema(idParamSchema, 'params'), 
  branchController.getBranchById
);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Actualizar sucursal
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sucursal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Branch'
 *     responses:
 *       200:
 *         description: Sucursal actualizada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Sucursal no encontrada
 */
router.put('/:id', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(idParamSchema, 'params'),
  validateSchema(branchUpdateSchema), 
  branchController.updateBranch
);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Eliminar sucursal
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sucursal
 *     responses:
 *       200:
 *         description: Sucursal eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Sucursal no encontrada
 */
router.delete('/:id', 
  authenticateToken, 
  authorize(['ADMIN']), 
  validateSchema(idParamSchema, 'params'), 
  branchController.deleteBranch
);

/**
 * @swagger
 * /api/branches/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas de sucursal
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sucursal
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha final
 *     responses:
 *       200:
 *         description: Estadísticas de la sucursal
 */
router.get('/:id/stats', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(idParamSchema, 'params'),
  validateSchema(dateRangeSchema, 'query'), 
  branchController.getBranchStats
);

module.exports = router;