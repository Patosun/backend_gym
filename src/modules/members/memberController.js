const memberService = require('./memberService');
const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     Member:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - membershipNumber
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del miembro
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID del usuario asociado
 *         membershipNumber:
 *           type: string
 *           description: Número único de membresía
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento
 *         emergencyContact:
 *           type: string
 *           description: Contacto de emergencia
 *         emergencyPhone:
 *           type: string
 *           description: Teléfono de emergencia
 *         medicalNotes:
 *           type: string
 *           description: Notas médicas importantes
 *         qrCode:
 *           type: string
 *           format: uuid
 *           description: Código QR único del miembro
 *         qrCodeExpiry:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración del QR
 *         isActive:
 *           type: boolean
 *           description: Estado del miembro
 *         joinDate:
 *           type: string
 *           format: date
 *           description: Fecha de ingreso al gimnasio
 *         user:
 *           $ref: '#/components/schemas/User'
 *         memberships:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Membership'
 *     MemberCreate:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         medicalNotes:
 *           type: string
 *         joinDate:
 *           type: string
 *           format: date
 *     MemberUpdate:
 *       type: object
 *       properties:
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         medicalNotes:
 *           type: string
 *         isActive:
 *           type: boolean
 */

// Esquemas de validación
const createMemberSchema = z.object({
  userId: z.string().uuid(),
  dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
  medicalNotes: z.string().optional(),
  joinDate: z.string().optional().transform(val => val ? new Date(val) : new Date())
});

const updateMemberSchema = z.object({
  dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
  medicalNotes: z.string().optional(),
  isActive: z.boolean().optional()
});

const memberController = {
  /**
   * @swagger
   * /api/members:
   *   get:
   *     summary: Obtener todos los miembros
   *     tags: [Members]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
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
   *         name: search
   *         schema:
   *           type: string
   *         description: Buscar por nombre, email o número de membresía
   *     responses:
   *       200:
   *         description: Lista de miembros
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 members:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Member'
   *                 pagination:
   *                   type: object
   */
  async getAllMembers(req, res) {
    try {
      const { isActive, page = 1, limit = 10, search } = req.query;
      
      const filters = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) {
        filters.search = search;
      }

      const result = await memberService.getAllMembers(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting members:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members:
   *   post:
   *     summary: Crear nuevo miembro
   *     tags: [Members]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MemberCreate'
   *     responses:
   *       201:
   *         description: Miembro creado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Member'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos
   */
  async createMember(req, res) {
    try {
      // Solo admin y empleados pueden crear miembros
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para crear miembros' });
      }

      const validatedData = createMemberSchema.parse(req.body);
      const member = await memberService.createMember(validatedData);
      
      res.status(201).json(member);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message.includes('ya existe') || error.message.includes('no encontrado')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating member:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/{id}:
   *   get:
   *     summary: Obtener miembro por ID
   *     tags: [Members]
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
   *         description: Datos del miembro
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Member'
   *       404:
   *         description: Miembro no encontrado
   */
  async getMemberById(req, res) {
    try {
      const { id } = req.params;
      const member = await memberService.getMemberById(id);
      
      if (!member) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
      }

      res.json(member);
    } catch (error) {
      console.error('Error getting member:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/qr/{qrCode}:
   *   get:
   *     summary: Obtener miembro por código QR
   *     tags: [Members]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: qrCode
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Datos del miembro
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Member'
   *       404:
   *         description: QR no válido o expirado
   */
  async getMemberByQR(req, res) {
    try {
      const { qrCode } = req.params;
      const member = await memberService.getMemberByQR(qrCode);
      
      if (!member) {
        return res.status(404).json({ error: 'Código QR no válido o expirado' });
      }

      res.json(member);
    } catch (error) {
      console.error('Error getting member by QR:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/{id}:
   *   put:
   *     summary: Actualizar miembro
   *     tags: [Members]
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
   *             $ref: '#/components/schemas/MemberUpdate'
   *     responses:
   *       200:
   *         description: Miembro actualizado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Member'
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Miembro no encontrado
   */
  async updateMember(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateMemberSchema.parse(req.body);

      // Verificar permisos
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        // Los miembros solo pueden actualizar su propio perfil
        const member = await memberService.getMemberById(id);
        if (!member || member.userId !== req.user.id) {
          return res.status(403).json({ error: 'Sin permisos para actualizar este miembro' });
        }
      }

      const member = await memberService.updateMember(id, validatedData);
      res.json(member);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Miembro no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating member:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/{id}/regenerate-qr:
   *   patch:
   *     summary: Regenerar código QR del miembro
   *     tags: [Members]
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
   *         description: QR regenerado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 qrCode:
   *                   type: string
   *                 qrCodeExpiry:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Miembro no encontrado
   */
  async regenerateQR(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar permisos
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        const member = await memberService.getMemberById(id);
        if (!member || member.userId !== req.user.id) {
          return res.status(403).json({ error: 'Sin permisos para regenerar QR de este miembro' });
        }
      }

      const result = await memberService.regenerateQR(id);
      res.json({
        message: 'Código QR regenerado correctamente',
        qrCode: result.qrCode,
        qrCodeExpiry: result.qrCodeExpiry
      });
    } catch (error) {
      if (error.message === 'Miembro no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error regenerating QR:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/{id}/membership-status:
   *   get:
   *     summary: Obtener estado de membresía del miembro
   *     tags: [Members]
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
   *         description: Estado de membresía
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 hasActiveMembership:
   *                   type: boolean
   *                 currentMembership:
   *                   $ref: '#/components/schemas/Membership'
   *                 daysRemaining:
   *                   type: integer
   *                 isExpired:
   *                   type: boolean
   *       404:
   *         description: Miembro no encontrado
   */
  async getMembershipStatus(req, res) {
    try {
      const { id } = req.params;
      const status = await memberService.getMembershipStatus(id);
      res.json(status);
    } catch (error) {
      if (error.message === 'Miembro no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error getting membership status:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/{id}/checkins:
   *   get:
   *     summary: Obtener historial de check-ins del miembro
   *     tags: [Members]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
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
   *         description: Historial de check-ins
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 checkins:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/CheckIn'
   *                 pagination:
   *                   type: object
   *                 stats:
   *                   type: object
   *                   properties:
   *                     totalCheckins:
   *                       type: integer
   *                     thisMonth:
   *                       type: integer
   *                     averagePerWeek:
   *                       type: number
   */
  async getMemberCheckins(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, startDate, endDate } = req.query;
      
      const filters = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await memberService.getMemberCheckins(id, filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting member checkins:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/members/stats:
   *   get:
   *     summary: Estadísticas de miembros
   *     tags: [Members]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de miembros
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: integer
   *                 active:
   *                   type: integer
   *                 inactive:
   *                   type: integer
   *                 withActiveMembership:
   *                   type: integer
   *                 newThisMonth:
   *                   type: integer
   *                 averageAge:
   *                   type: number
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos
   */
  async getMemberStats(req, res) {
    try {
      // Solo admin y empleados pueden ver estadísticas
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver estadísticas' });
      }

      const stats = await memberService.getMemberStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting member stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = memberController;