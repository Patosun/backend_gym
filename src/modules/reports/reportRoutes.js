const express = require('express');
const reportController = require('./reportController');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');
const { dateRangeSchema } = require('../../utils/zodSchemas');

const router = express.Router();

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.get('/dashboard', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  reportController.getDashboardStats
);

/**
 * @swagger
 * /api/reports/memberships:
 *   get:
 *     summary: Reporte de membresías
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *       - in: query
 *         name: membershipTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por tipo de membresía
 *     responses:
 *       200:
 *         description: Reporte de membresías
 */
router.get('/memberships', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(dateRangeSchema, 'query'),
  reportController.getMembershipReport
);

/**
 * @swagger
 * /api/reports/attendance:
 *   get:
 *     summary: Reporte de asistencia
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *     responses:
 *       200:
 *         description: Reporte de asistencia
 */
router.get('/attendance', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(dateRangeSchema, 'query'),
  reportController.getAttendanceReport
);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Reporte de ingresos
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CASH, CARD, QR]
 *         description: Filtrar por método de pago
 *     responses:
 *       200:
 *         description: Reporte de ingresos
 */
router.get('/revenue', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(dateRangeSchema, 'query'),
  reportController.getRevenueReport
);

module.exports = router;