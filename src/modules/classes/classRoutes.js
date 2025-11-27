const express = require('express');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');
const classController = require('./classController');
const {
  classCreateSchema,
  classUpdateSchema,
  classFiltersSchema,
  createReservationSchema,
  updateReservationSchema,
  memberReservationFiltersSchema
} = require('../../utils/zodSchemas');

const router = express.Router();

// ===================
// CLASSES ROUTES
// ===================

/**
 * @swagger
 * /api/classes:
 *   get:
 *     tags: [Classes]
 *     summary: Obtener todas las clases
 *     description: Obtiene una lista de todas las clases con filtros y paginación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID de la sucursal
 *       - in: query
 *         name: trainerId
 *         schema:
 *           type: string
 *         description: ID del entrenador
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Estado de la clase
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio del filtro
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin del filtro
 *     responses:
 *       200:
 *         description: Lista de clases obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', 
  authenticateToken, 
  validateSchema(classFiltersSchema, 'query'),
  classController.getAllClasses
);

/**
 * @swagger
 * /api/classes/available:
 *   get:
 *     tags: [Classes]
 *     summary: Obtener clases disponibles para reservar
 *     description: Obtiene todas las clases futuras disponibles para reservar (con cupos libres)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID de la sucursal (opcional)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha específica
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Clases disponibles obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classes:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Class'
 *                       - type: object
 *                         properties:
 *                           availableSpots:
 *                             type: integer
 *                             description: Cupos disponibles
 *                           _count:
 *                             type: object
 *                             properties:
 *                               reservations:
 *                                 type: integer
 *                 total:
 *                   type: integer
 *                   description: Total de clases disponibles
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/available', 
  authenticateToken,
  classController.getAvailableClasses
);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     tags: [Classes]
 *     summary: Crear nueva clase
 *     description: Crea una nueva clase. Solo administradores y empleados pueden crear clases.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClass'
 *     responses:
 *       201:
 *         description: Clase creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Clase creada exitosamente
 *                 class:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']),
  validateSchema(classCreateSchema),
  classController.createClass
);

/**
 * @swagger
 * /api/classes/stats:
 *   get:
 *     tags: [Classes]
 *     summary: Obtener estadísticas de clases
 *     description: Obtiene estadísticas generales de clases y reservas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: ID de la sucursal para filtrar estadísticas
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio del período
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin del período
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClasses:
 *                   type: integer
 *                 scheduledClasses:
 *                   type: integer
 *                 completedClasses:
 *                   type: integer
 *                 cancelledClasses:
 *                   type: integer
 *                 reservations:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     confirmed:
 *                       type: integer
 *                     cancelled:
 *                       type: integer
 *                 averageAttendance:
 *                   type: integer
 *                   description: Porcentaje promedio de asistencia
 *                 popularTimes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                       reservations:
 *                         type: integer
 *                       classes:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats',
  authenticateToken,
  authorize(['ADMIN', 'EMPLOYEE']),
  classController.getClassStats
);

/**
 * @swagger
 * /api/classes/my-reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: Obtener mis reservas
 *     description: Obtiene todas las reservas del miembro autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONFIRMED, COMPLETED, CANCELLED, NO_SHOW]
 *         description: Estado de la reserva
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Filtrar solo reservas futuras
 *     responses:
 *       200:
 *         description: Reservas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/my-reservations', 
  authenticateToken,
  authorize(['MEMBER']),
  validateSchema(memberReservationFiltersSchema, 'query'),
  classController.getMyReservations
);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: Obtener clase por ID
 *     description: Obtiene los detalles de una clase específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase
 *     responses:
 *       200:
 *         description: Clase obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', 
  authenticateToken,
  classController.getClassById
);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     tags: [Classes]
 *     summary: Actualizar clase
 *     description: Actualiza los datos de una clase existente. Solo administradores y empleados pueden actualizar clases.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClass'
 *     responses:
 *       200:
 *         description: Clase actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Clase actualizada exitosamente
 *                 class:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']),
  validateSchema(classUpdateSchema),
  classController.updateClass
);

/**
 * @swagger
 * /api/classes/{id}/cancel:
 *   patch:
 *     tags: [Classes]
 *     summary: Cancelar clase
 *     description: Cancela una clase y automáticamente cancela todas las reservas asociadas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón de la cancelación
 *                 example: Entrenador enfermo
 *     responses:
 *       200:
 *         description: Clase cancelada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Clase cancelada exitosamente
 *                 class:
 *                   $ref: '#/components/schemas/Class'
 *                 notifiedMembers:
 *                   type: integer
 *                   description: Número de miembros notificados
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/cancel', 
  authenticateToken, 
  authorize(['ADMIN', 'EMPLOYEE']),
  classController.cancelClass
);

// ===================
// RESERVATIONS ROUTES
// ===================

/**
 * @swagger
 * /api/classes/{id}/reservations:
 *   get:
 *     tags: [Classes, Reservations]
 *     summary: Obtener reservas de una clase
 *     description: Obtiene todas las reservas de una clase específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase
 *     responses:
 *       200:
 *         description: Reservas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/reservations', 
  authenticateToken,
  classController.getClassReservations
);

/**
 * @swagger
 * /api/classes/{id}/reservations:
 *   post:
 *     tags: [Classes, Reservations]
 *     summary: Crear reserva para una clase
 *     description: Crea una nueva reserva para una clase. Los miembros pueden crear sus propias reservas, mientras que administradores y empleados pueden crear reservas para cualquier miembro.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservation'
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reserva creada exitosamente
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/reservations', 
  authenticateToken,
  validateSchema(createReservationSchema),
  classController.createReservation
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     tags: [Reservations]
 *     summary: Obtener reserva por ID
 *     description: Obtiene los detalles de una reserva específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/reservations/:id', 
  authenticateToken,
  classController.getReservationById
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     tags: [Reservations]
 *     summary: Actualizar reserva
 *     description: Actualiza los datos de una reserva existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReservation'
 *     responses:
 *       200:
 *         description: Reserva actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reserva actualizada exitosamente
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/reservations/:id', 
  authenticateToken,
  validateSchema(updateReservationSchema),
  classController.updateReservation
);

module.exports = router;