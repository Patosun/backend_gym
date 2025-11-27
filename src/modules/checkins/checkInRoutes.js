const express = require('express');
const checkInController = require('./checkInController');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');
const { audit } = require('../../middlewares/audit');
const {
  checkInCreateSchema,
  checkOutSchema,
  idParamSchema,
  paginationSchema,
  dateRangeSchema
} = require('../../utils/zodSchemas');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CheckIn:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         checkInAt:
 *           type: string
 *           format: date-time
 *         checkOutAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /api/checkins:
 *   post:
 *     summary: Realizar check-in mediante QR
 *     tags: [Check-ins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *               - branchId
 *             properties:
 *               qrCode:
 *                 type: string
 *                 description: Código QR del miembro
 *               branchId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la sucursal
 *     responses:
 *       201:
 *         description: Check-in realizado exitosamente
 *       400:
 *         description: QR inválido o expirado
 *       403:
 *         description: Membresía inactiva
 */
router.post('/', validateSchema(checkInCreateSchema), checkInController.checkIn);

/**
 * @swagger
 * /api/checkins/my-active:
 *   get:
 *     summary: Obtener mi check-in activo
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in activo del miembro
 *       404:
 *         description: No hay check-in activo
 */
router.get('/my-active', 
  authenticateToken, 
  authorize(['MEMBER']), 
  checkInController.getMyActiveCheckIn
);

/**
 * @swagger
 * /api/checkins/active:
 *   get:
 *     summary: Obtener todos los check-ins activos
 *     tags: [Check-ins]
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
 *         description: Lista de check-ins activos
 */
router.get('/active', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  checkInController.getActiveCheckIns
);

/**
 * @swagger
 * /api/checkins/stats:
 *   get:
 *     summary: Obtener estadísticas de asistencia
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
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
 *         description: Estadísticas de asistencia
 */
router.get('/stats', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']), 
  validateSchema(dateRangeSchema, 'query'), 
  checkInController.getAttendanceStats
);

/**
 * @swagger
 * /api/checkins/force-checkout:
 *   post:
 *     summary: Forzar check-out automático
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hoursThreshold:
 *                 type: integer
 *                 default: 24
 *                 description: Horas después de las cuales forzar check-out
 *     responses:
 *       200:
 *         description: Check-out automático realizado
 */
router.post('/force-checkout', 
  authenticateToken, 
  authorize(['ADMIN']), 
  checkInController.forceCheckOut
);

/**
 * @swagger
 * /api/checkins:
 *   get:
 *     summary: Obtener historial de check-ins
 *     tags: [Check-ins]
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
 *         name: memberId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por miembro
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por sucursal
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
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Solo check-ins activos
 *     responses:
 *       200:
 *         description: Historial de check-ins
 */
router.get('/', 
  authenticateToken, 
  validateSchema(paginationSchema, 'query'), 
  checkInController.getCheckInHistory
);

/**
 * @swagger
 * /api/checkins/{id}/checkout:
 *   put:
 *     summary: Realizar check-out
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del check-in
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *     responses:
 *       200:
 *         description: Check-out realizado exitosamente
 *       404:
 *         description: Check-in no encontrado
 *       400:
 *         description: Ya se realizó check-out
 */
router.put('/:id/checkout', 
  authenticateToken, 
  validateSchema(idParamSchema, 'params'),
  validateSchema(checkOutSchema), 
  checkInController.checkOut
);

/**
 * @swagger
 * /api/checkins/admin/checkin:
 *   post:
 *     summary: Realizar check-in administrativo por memberId
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - branchId
 *             properties:
 *               memberId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del miembro
 *               branchId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la sucursal
 *     responses:
 *       201:
 *         description: Check-in realizado exitosamente
 *       400:
 *         description: Error en la validación
 */
router.post('/admin/checkin', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']),
  checkInController.adminCheckIn
);

/**
 * @swagger
 * /api/checkins/admin/checkout:
 *   post:
 *     summary: Realizar check-out administrativo por memberId
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del miembro
 *     responses:
 *       200:
 *         description: Check-out realizado exitosamente
 *       400:
 *         description: Error en la validación
 */
router.post('/admin/checkout', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']),
  checkInController.adminCheckOut
);

/**
 * @swagger
 * /api/checkins/admin/generate-qr:
 *   post:
 *     summary: Generar QR code visual para check-ins
 *     tags: [Check-ins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *             properties:
 *               branchId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la sucursal para el check-in
 *     responses:
 *       200:
 *         description: QR code generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCodeImage:
 *                       type: string
 *                       description: Imagen QR en formato base64
 *                     qrData:
 *                       type: object
 *                       description: Datos contenidos en el QR
 *                     branch:
 *                       type: object
 *                       description: Información de la sucursal
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Fecha de expiración del QR
 *       400:
 *         description: Error en la validación
 *       404:
 *         description: Sucursal no encontrada
 */
router.post('/admin/generate-qr', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']),
  checkInController.generateQRForCheckin
);

module.exports = router;