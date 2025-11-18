const classService = require('./classService');
const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Nombre de la clase
 *         description:
 *           type: string
 *           description: Descripción de la clase
 *         branchId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           description: Capacidad máxima de participantes
 *         duration:
 *           type: integer
 *           minimum: 1
 *           description: Duración en minutos
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         isRecurring:
 *           type: boolean
 *           description: Si la clase es recurrente
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Precio de la clase (null si está incluida en membresía)
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 *         trainer:
 *           $ref: '#/components/schemas/Trainer'
 *         reservations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Reservation'
 *     ClassCreate:
 *       type: object
 *       required:
 *         - name
 *         - branchId
 *         - trainerId
 *         - capacity
 *         - duration
 *         - startTime
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *         branchId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         duration:
 *           type: integer
 *           minimum: 1
 *         startTime:
 *           type: string
 *           format: date-time
 *         isRecurring:
 *           type: boolean
 *         price:
 *           type: number
 *           minimum: 0
 *     Reservation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         classId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
 *         notes:
 *           type: string
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         class:
 *           $ref: '#/components/schemas/Class'
 *     ReservationCreate:
 *       type: object
 *       required:
 *         - memberId
 *         - classId
 *       properties:
 *         memberId:
 *           type: string
 *           format: uuid
 *         classId:
 *           type: string
 *           format: uuid
 *         notes:
 *           type: string
 */

// Esquemas de validación
const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  branchId: z.string().uuid(),
  trainerId: z.string().uuid(),
  capacity: z.number().int().min(1),
  duration: z.number().int().min(1),
  startTime: z.string().transform(val => new Date(val)),
  isRecurring: z.boolean().default(false),
  price: z.number().min(0).optional()
});

const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  trainerId: z.string().uuid().optional(),
  capacity: z.number().int().min(1).optional(),
  duration: z.number().int().min(1).optional(),
  startTime: z.string().transform(val => new Date(val)).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  price: z.number().min(0).optional()
});

const createReservationSchema = z.object({
  memberId: z.string().uuid(),
  classId: z.string().uuid(),
  notes: z.string().optional()
});

const updateReservationSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional()
});

const classController = {
  // ===================
  // CLASSES
  // ===================

  /**
   * @swagger
   * /api/classes:
   *   get:
   *     summary: Obtener todas las clases
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: branchId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: trainerId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *     responses:
   *       200:
   *         description: Lista de clases
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
   *                   type: object
   */
  async getAllClasses(req, res) {
    try {
      const { 
        branchId, 
        trainerId, 
        status, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filters = {};
      if (branchId) filters.branchId = branchId;
      if (trainerId) filters.trainerId = trainerId;
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await classService.getAllClasses(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting classes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Obtener clases disponibles para reservar
   */
  async getAvailableClasses(req, res) {
    try {
      const { date, limit = 20 } = req.query;
      let { branchId } = req.query;
      
      // Si hay un usuario autenticado con rol MEMBER y no se especificó branchId,
      // podríamos buscar la última sucursal donde hizo check-in, pero por ahora
      // mostramos todas las clases para que el miembro pueda elegir cualquier sucursal
      
      const filters = {};
      if (branchId) filters.branchId = branchId;
      if (date) filters.date = new Date(date);

      const result = await classService.getAvailableClasses(filters, parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting available classes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes:
   *   post:
   *     summary: Crear nueva clase
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClassCreate'
   *     responses:
   *       201:
   *         description: Clase creada correctamente
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: Sin permisos
   */
  async createClass(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para crear clases' });
      }

      const validatedData = createClassSchema.parse(req.body);
      
      // Calcular endTime basado en startTime y duration
      const endTime = new Date(validatedData.startTime);
      endTime.setMinutes(endTime.getMinutes() + validatedData.duration);
      
      const classData = {
        ...validatedData,
        endTime,
        status: 'SCHEDULED'
      };

      const newClass = await classService.createClass(classData);
      
      res.status(201).json(newClass);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message.includes('no encontrado') || error.message.includes('conflicto')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating class:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/{id}:
   *   get:
   *     summary: Obtener clase por ID
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Datos de la clase
   *       404:
   *         description: Clase no encontrada
   */
  async getClassById(req, res) {
    try {
      const { id } = req.params;
      const classData = await classService.getClassById(id);
      
      if (!classData) {
        return res.status(404).json({ error: 'Clase no encontrada' });
      }

      res.json(classData);
    } catch (error) {
      console.error('Error getting class:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/{id}:
   *   put:
   *     summary: Actualizar clase
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               trainerId:
   *                 type: string
   *                 format: uuid
   *               capacity:
   *                 type: integer
   *               duration:
   *                 type: integer
   *               startTime:
   *                 type: string
   *                 format: date-time
   *               status:
   *                 type: string
   *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
   *               price:
   *                 type: number
   *     responses:
   *       200:
   *         description: Clase actualizada correctamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Clase no encontrada
   *       403:
   *         description: Sin permisos
   */
  async updateClass(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para actualizar clases' });
      }

      const { id } = req.params;
      const validatedData = updateClassSchema.parse(req.body);

      // Si se actualiza startTime o duration, recalcular endTime
      if (validatedData.startTime || validatedData.duration) {
        const currentClass = await classService.getClassById(id);
        if (!currentClass) {
          return res.status(404).json({ error: 'Clase no encontrada' });
        }

        const startTime = validatedData.startTime || currentClass.startTime;
        const duration = validatedData.duration || currentClass.duration;
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);
        
        validatedData.endTime = endTime;
      }

      const updatedClass = await classService.updateClass(id, validatedData);
      res.json(updatedClass);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Clase no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating class:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/{id}/cancel:
   *   patch:
   *     summary: Cancelar clase
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Razón de la cancelación
   *     responses:
   *       200:
   *         description: Clase cancelada correctamente
   *       400:
   *         description: La clase no se puede cancelar
   *       404:
   *         description: Clase no encontrada
   *       403:
   *         description: Sin permisos
   */
  async cancelClass(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para cancelar clases' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const result = await classService.cancelClass(id, reason);
      res.json({
        message: 'Clase cancelada correctamente',
        class: result.class,
        notifiedMembers: result.notifiedMembers
      });
    } catch (error) {
      if (error.message.includes('no encontrada') || error.message.includes('no se puede')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error cancelling class:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ===================
  // RESERVATIONS
  // ===================

  /**
   * @swagger
   * /api/classes/{id}/reservations:
   *   get:
   *     summary: Obtener reservas de una clase
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Lista de reservas
   */
  async getClassReservations(req, res) {
    try {
      const { id } = req.params;
      const reservations = await classService.getClassReservations(id);
      res.json(reservations);
    } catch (error) {
      console.error('Error getting class reservations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/reservations:
   *   post:
   *     summary: Crear nueva reserva
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ReservationCreate'
   *     responses:
   *       201:
   *         description: Reserva creada correctamente
   *       400:
   *         description: Datos inválidos o clase llena
   *       403:
   *         description: Sin permisos
   */
  async createReservation(req, res) {
    try {
      const { id: classId } = req.params; // Tomar classId de la URL
      console.log('Creating reservation - ClassId from URL:', classId);
      console.log('Creating reservation - Body:', req.body);
      
      const validatedData = createReservationSchema.parse({
        ...req.body,
        classId // Agregar classId de la URL
      });
      
      console.log('Validated data:', validatedData);
      
      // Verificar permisos - miembros solo pueden hacer sus propias reservas
      if (req.user.role === 'MEMBER') {
        const member = await classService.getMemberByUserId(req.user.id);
        if (!member || member.id !== validatedData.memberId) {
          return res.status(403).json({ error: 'Solo puedes hacer reservas para tu propia cuenta' });
        }
      }

      const reservation = await classService.createReservation(validatedData);
      
      res.status(201).json(reservation);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message.includes('no encontrado') || error.message.includes('llena') || error.message.includes('ya tiene')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating reservation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/reservations/{id}:
   *   get:
   *     summary: Obtener reserva por ID
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Datos de la reserva
   *       404:
   *         description: Reserva no encontrada
   */
  async getReservationById(req, res) {
    try {
      const { id } = req.params;
      const reservation = await classService.getReservationById(id);
      
      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      res.json(reservation);
    } catch (error) {
      console.error('Error getting reservation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/reservations/{id}:
   *   put:
   *     summary: Actualizar reserva
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reserva actualizada correctamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Reserva no encontrada
   *       403:
   *         description: Sin permisos
   */
  async updateReservation(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateReservationSchema.parse(req.body);

      // Verificar permisos
      if (req.user.role === 'MEMBER') {
        const reservation = await classService.getReservationById(id);
        if (!reservation) {
          return res.status(404).json({ error: 'Reserva no encontrada' });
        }
        
        const member = await classService.getMemberByUserId(req.user.id);
        if (!member || reservation.memberId !== member.id) {
          return res.status(403).json({ error: 'Sin permisos para actualizar esta reserva' });
        }

        // Los miembros solo pueden cancelar
        if (validatedData.status && validatedData.status !== 'CANCELLED') {
          return res.status(403).json({ error: 'Solo puedes cancelar tu reserva' });
        }
      }

      const updatedReservation = await classService.updateReservation(id, validatedData);
      res.json(updatedReservation);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Reserva no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating reservation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/reservations/member/{memberId}:
   *   get:
   *     summary: Obtener reservas de un miembro
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: memberId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
   *       - in: query
   *         name: upcoming
   *         schema:
   *           type: boolean
   *         description: Solo reservas futuras
   *     responses:
   *       200:
   *         description: Lista de reservas del miembro
   */
  async getMemberReservations(req, res) {
    try {
      const { memberId } = req.params;
      const { status, upcoming } = req.query;

      // Verificar permisos
      if (req.user.role === 'MEMBER') {
        const member = await classService.getMemberByUserId(req.user.id);
        if (!member || member.id !== memberId) {
          return res.status(403).json({ error: 'Solo puedes ver tus propias reservas' });
        }
      }

      const filters = {};
      if (status) filters.status = status;
      if (upcoming === 'true') filters.upcoming = true;

      const reservations = await classService.getMemberReservations(memberId, filters);
      res.json(reservations);
    } catch (error) {
      console.error('Error getting member reservations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/classes/stats:
   *   get:
   *     summary: Estadísticas de clases
   *     tags: [Classes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: branchId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Estadísticas de clases
   *       403:
   *         description: Sin permisos
   */
  async getClassStats(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver estadísticas' });
      }

      const { branchId, startDate, endDate } = req.query;
      
      const filters = {};
      if (branchId) filters.branchId = branchId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const stats = await classService.getClassStats(filters);
      res.json(stats);
    } catch (error) {
      console.error('Error getting class stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Obtener reservas del miembro autenticado
   */
  async getMyReservations(req, res) {
    try {
      console.log('=== GET MY RESERVATIONS START ===');
      console.log('User ID:', req.user.id);
      console.log('Query params:', req.query);
      
      const { status, upcoming } = req.query;

      // Obtener el miembro del usuario autenticado
      console.log('Looking for member with userId:', req.user.id);
      const member = await classService.getMemberByUserId(req.user.id);
      console.log('Member found:', member);
      
      if (!member) {
        console.log('Member not found for userId:', req.user.id);
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado. Contacta al administrador para activar tu perfil de miembro.'
        });
      }

      const filters = {};
      if (status) filters.status = status;
      if (upcoming === 'true') filters.upcoming = true;

      console.log('Fetching reservations for memberId:', member.id, 'with filters:', filters);
      const reservations = await classService.getMemberReservations(member.id, filters);
      console.log('Reservations found:', reservations.length);

      res.json({
        success: true,
        reservations
      });
    } catch (error) {
      console.error('Error getting my reservations:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
};

module.exports = classController;