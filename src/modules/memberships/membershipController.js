const membershipService = require('./membershipService');
const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     MembershipType:
 *       type: object
 *       required:
 *         - name
 *         - durationDays
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Nombre del tipo de membresía
 *         description:
 *           type: string
 *           description: Descripción del tipo de membresía
 *         durationDays:
 *           type: integer
 *           minimum: 1
 *           description: Duración en días
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Precio de la membresía
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: Características incluidas
 *         maxClasses:
 *           type: integer
 *           minimum: 0
 *           description: Máximo de clases permitidas (null = ilimitado)
 *         isActive:
 *           type: boolean
 *           description: Si el tipo está activo
 *     Membership:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipTypeId:
 *           type: string
 *           format: uuid
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, SUSPENDED, CANCELLED]
 *         autoRenew:
 *           type: boolean
 *         notes:
 *           type: string
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         membershipType:
 *           $ref: '#/components/schemas/MembershipType'
 *     MembershipCreate:
 *       type: object
 *       required:
 *         - memberId
 *         - membershipTypeId
 *       properties:
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipTypeId:
 *           type: string
 *           format: uuid
 *         startDate:
 *           type: string
 *           format: date
 *         autoRenew:
 *           type: boolean
 *         notes:
 *           type: string
 */

// Esquemas de validación
const createMembershipTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  durationDays: z.number().int().min(1),
  price: z.number().min(0),
  features: z.array(z.string()).default([]),
  maxClasses: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true)
});

const updateMembershipTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  durationDays: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  maxClasses: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional()
});

const createMembershipSchema = z.object({
  memberId: z.string().uuid(),
  membershipTypeId: z.string().uuid(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : new Date()),
  autoRenew: z.boolean().default(false),
  notes: z.string().optional()
});

const updateMembershipSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']).optional(),
  autoRenew: z.boolean().optional(),
  notes: z.string().optional()
});

const membershipController = {
  // ===================
  // MEMBERSHIP TYPES
  // ===================

  /**
   * @swagger
   * /api/memberships/types:
   *   get:
   *     summary: Obtener todos los tipos de membresía
   *     tags: [Memberships]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
   *     responses:
   *       200:
   *         description: Lista de tipos de membresía
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/MembershipType'
   */
  async getAllMembershipTypes(req, res) {
    try {
      const { isActive } = req.query;
      const filters = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const types = await membershipService.getAllMembershipTypes(filters);
      res.json({ membershipTypes: types });
    } catch (error) {
      console.error('Error getting membership types:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/types:
   *   post:
   *     summary: Crear nuevo tipo de membresía
   *     tags: [Memberships]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MembershipType'
   *     responses:
   *       201:
   *         description: Tipo de membresía creado correctamente
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: Sin permisos (solo ADMIN)
   */
  async createMembershipType(req, res) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Solo administradores pueden crear tipos de membresía' });
      }

      const validatedData = createMembershipTypeSchema.parse(req.body);
      const membershipType = await membershipService.createMembershipType(validatedData);
      
      res.status(201).json(membershipType);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message.includes('ya existe')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating membership type:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/types/{id}:
   *   get:
   *     summary: Obtener tipo de membresía por ID
   *     tags: [Memberships]
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
   *         description: Datos del tipo de membresía
   *       404:
   *         description: Tipo de membresía no encontrado
   */
  async getMembershipTypeById(req, res) {
    try {
      const { id } = req.params;
      const membershipType = await membershipService.getMembershipTypeById(id);
      
      if (!membershipType) {
        return res.status(404).json({ error: 'Tipo de membresía no encontrado' });
      }

      res.json(membershipType);
    } catch (error) {
      console.error('Error getting membership type:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/types/{id}:
   *   put:
   *     summary: Actualizar tipo de membresía
   *     tags: [Memberships]
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
   *             $ref: '#/components/schemas/MembershipType'
   *     responses:
   *       200:
   *         description: Tipo actualizado correctamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Tipo no encontrado
   *       403:
   *         description: Sin permisos (solo ADMIN)
   */
  async updateMembershipType(req, res) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Solo administradores pueden actualizar tipos de membresía' });
      }

      const { id } = req.params;
      const validatedData = updateMembershipTypeSchema.parse(req.body);

      const membershipType = await membershipService.updateMembershipType(id, validatedData);
      res.json(membershipType);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Tipo de membresía no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating membership type:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ===================
  // MEMBERSHIPS
  // ===================

  /**
   * @swagger
   * /api/memberships:
   *   get:
   *     summary: Obtener todas las membresías
   *     tags: [Memberships]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ACTIVE, EXPIRED, SUSPENDED, CANCELLED]
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
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de membresías
   */
  async getAllMemberships(req, res) {
    try {
      const { status, page = 1, limit = 10, search } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (search) filters.search = search;

      const result = await membershipService.getAllMemberships(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting memberships:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships:
   *   post:
   *     summary: Crear nueva membresía
   *     tags: [Memberships]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MembershipCreate'
   *     responses:
   *       201:
   *         description: Membresía creada correctamente
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: Sin permisos
   */
  async createMembership(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para crear membresías' });
      }

      const validatedData = createMembershipSchema.parse(req.body);
      const membership = await membershipService.createMembership(validatedData);
      
      res.status(201).json(membership);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message.includes('no encontrado') || error.message.includes('ya tiene')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating membership:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/{id}:
   *   get:
   *     summary: Obtener membresía por ID
   *     tags: [Memberships]
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
   *         description: Datos de la membresía
   *       404:
   *         description: Membresía no encontrada
   */
  async getMembershipById(req, res) {
    try {
      const { id } = req.params;
      const membership = await membershipService.getMembershipById(id);
      
      if (!membership) {
        return res.status(404).json({ error: 'Membresía no encontrada' });
      }

      res.json(membership);
    } catch (error) {
      console.error('Error getting membership:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/{id}:
   *   put:
   *     summary: Actualizar membresía
   *     tags: [Memberships]
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
   *                 enum: [ACTIVE, EXPIRED, SUSPENDED, CANCELLED]
   *               autoRenew:
   *                 type: boolean
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Membresía actualizada correctamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Membresía no encontrada
   *       403:
   *         description: Sin permisos
   */
  async updateMembership(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para actualizar membresías' });
      }

      const { id } = req.params;
      const validatedData = updateMembershipSchema.parse(req.body);

      const membership = await membershipService.updateMembership(id, validatedData);
      res.json(membership);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Membresía no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating membership:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/{id}/extend:
   *   patch:
   *     summary: Extender membresía
   *     tags: [Memberships]
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
   *             required:
   *               - days
   *             properties:
   *               days:
   *                 type: integer
   *                 minimum: 1
   *                 description: Días a extender
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Membresía extendida correctamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Membresía no encontrada
   *       403:
   *         description: Sin permisos
   */
  async extendMembership(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para extender membresías' });
      }

      const { id } = req.params;
      const { days, notes } = req.body;

      if (!days || days <= 0) {
        return res.status(400).json({ error: 'Debe especificar un número válido de días' });
      }

      const membership = await membershipService.extendMembership(id, days, notes);
      res.json(membership);
    } catch (error) {
      if (error.message === 'Membresía no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error extending membership:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/stats:
   *   get:
   *     summary: Estadísticas de membresías
   *     tags: [Memberships]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de membresías
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: integer
   *                 active:
   *                   type: integer
   *                 expired:
   *                   type: integer
   *                 expiringSoon:
   *                   type: integer
   *                   description: Expiran en los próximos 7 días
   *                 byType:
   *                   type: object
   *                 revenue:
   *                   type: object
   *       403:
   *         description: Sin permisos
   */
  async getMembershipStats(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver estadísticas' });
      }

      const stats = await membershipService.getMembershipStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting membership stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/memberships/expiring:
   *   get:
   *     summary: Membresías próximas a expirar
   *     tags: [Memberships]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 7
   *         description: Días de anticipación
   *     responses:
   *       200:
   *         description: Lista de membresías próximas a expirar
   *       403:
   *         description: Sin permisos
   */
  async getExpiringMemberships(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver esta información' });
      }

      const { days = 7 } = req.query;
      const memberships = await membershipService.getExpiringMemberships(parseInt(days));
      res.json(memberships);
    } catch (error) {
      console.error('Error getting expiring memberships:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = membershipController;