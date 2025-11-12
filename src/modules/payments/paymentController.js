const paymentService = require('./paymentService');
const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           minimum: 0
 *         method:
 *           type: string
 *           enum: [CASH, QR]
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *         description:
 *           type: string
 *         reference:
 *           type: string
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         dueDate:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         membership:
 *           $ref: '#/components/schemas/Membership'
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 *     PaymentCreate:
 *       type: object
 *       required:
 *         - memberId
 *         - amount
 *         - method
 *         - branchId
 *       properties:
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           minimum: 0
 *         method:
 *           type: string
 *           enum: [CASH, QR]
 *         description:
 *           type: string
 *         reference:
 *           type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 */

// Esquemas de validación
const createPaymentSchema = z.object({
  memberId: z.string().uuid(),
  membershipId: z.string().uuid().optional(),
  branchId: z.string().uuid(),
  amount: z.number().min(0),
  method: z.enum(['CASH', 'QR']),
  description: z.string().optional(),
  reference: z.string().max(100).optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional()
});

const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

const paymentController = {
  /**
   * @swagger
   * /api/payments:
   *   get:
   *     summary: Obtener todos los pagos
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, COMPLETED, CANCELLED]
   *       - in: query
   *         name: method
   *         schema:
   *           type: string
   *           enum: [CASH, QR]
   *       - in: query
   *         name: memberId
   *         schema:
   *           type: string
   *           format: uuid
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
   *         description: Lista de pagos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 payments:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Payment'
   *                 pagination:
   *                   type: object
   *                 summary:
   *                   type: object
   *                   properties:
   *                     totalAmount:
   *                       type: number
   *                     completedAmount:
   *                       type: number
   *                     pendingAmount:
   *                       type: number
   */
  async getAllPayments(req, res) {
    try {
      const { 
        status, 
        method, 
        memberId, 
        branchId, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (method) filters.method = method;
      if (memberId) filters.memberId = memberId;
      if (branchId) filters.branchId = branchId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await paymentService.getAllPayments(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments:
   *   post:
   *     summary: Crear nuevo pago
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PaymentCreate'
   *     responses:
   *       201:
   *         description: Pago creado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Payment'
   *       400:
   *         description: Datos inválidos
   *       403:
   *         description: Sin permisos
   */
  async createPayment(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para crear pagos' });
      }

      const validatedData = createPaymentSchema.parse(req.body);
      
      // Para pagos en efectivo, marcar como completado inmediatamente
      if (validatedData.method === 'CASH') {
        validatedData.status = 'COMPLETED';
        validatedData.paymentDate = new Date();
      } else {
        validatedData.status = 'PENDING';
      }

      const payment = await paymentService.createPayment(validatedData);
      
      res.status(201).json(payment);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message.includes('no encontrado')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/{id}:
   *   get:
   *     summary: Obtener pago por ID
   *     tags: [Payments]
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
   *         description: Datos del pago
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Payment'
   *       404:
   *         description: Pago no encontrado
   */
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);
      
      if (!payment) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      res.json(payment);
    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/{id}:
   *   put:
   *     summary: Actualizar pago
   *     tags: [Payments]
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
   *                 enum: [PENDING, COMPLETED, CANCELLED]
   *               reference:
   *                 type: string
   *               notes:
   *                 type: string
   *               paymentDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Pago actualizado correctamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Pago no encontrado
   *       403:
   *         description: Sin permisos
   */
  async updatePayment(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para actualizar pagos' });
      }

      const { id } = req.params;
      const validatedData = updatePaymentSchema.parse(req.body);

      // Si se marca como completado, establecer fecha de pago
      if (validatedData.status === 'COMPLETED' && !validatedData.paymentDate) {
        validatedData.paymentDate = new Date();
      }

      const payment = await paymentService.updatePayment(id, validatedData);
      res.json(payment);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Pago no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating payment:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/{id}/confirm:
   *   patch:
   *     summary: Confirmar pago pendiente
   *     tags: [Payments]
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
   *               reference:
   *                 type: string
   *                 description: Referencia del pago (para QR)
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Pago confirmado correctamente
   *       400:
   *         description: El pago no se puede confirmar
   *       404:
   *         description: Pago no encontrado
   *       403:
   *         description: Sin permisos
   */
  async confirmPayment(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para confirmar pagos' });
      }

      const { id } = req.params;
      const { reference, notes } = req.body;

      const payment = await paymentService.confirmPayment(id, reference, notes);
      res.json({
        message: 'Pago confirmado correctamente',
        payment
      });
    } catch (error) {
      if (error.message.includes('no encontrado') || error.message.includes('no se puede')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error confirming payment:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/{id}/cancel:
   *   patch:
   *     summary: Cancelar pago
   *     tags: [Payments]
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
   *         description: Pago cancelado correctamente
   *       400:
   *         description: El pago no se puede cancelar
   *       404:
   *         description: Pago no encontrado
   *       403:
   *         description: Sin permisos
   */
  async cancelPayment(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para cancelar pagos' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const payment = await paymentService.cancelPayment(id, reason);
      res.json({
        message: 'Pago cancelado correctamente',
        payment
      });
    } catch (error) {
      if (error.message.includes('no encontrado') || error.message.includes('no se puede')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error cancelling payment:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/member/{memberId}:
   *   get:
   *     summary: Obtener historial de pagos de un miembro
   *     tags: [Payments]
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
   *         description: Historial de pagos del miembro
   */
  async getPaymentsByMember(req, res) {
    try {
      const { memberId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Verificar permisos - miembros solo pueden ver sus propios pagos
      if (req.user.role === 'MEMBER') {
        const member = await paymentService.getMemberByUserId(req.user.id);
        if (!member || member.id !== memberId) {
          return res.status(403).json({ error: 'Sin permisos para ver estos pagos' });
        }
      }

      const result = await paymentService.getPaymentsByMember(memberId, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting member payments:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/stats:
   *   get:
   *     summary: Estadísticas de pagos
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *         name: branchId
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Estadísticas de pagos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: object
   *                   properties:
   *                     count:
   *                       type: integer
   *                     amount:
   *                       type: number
   *                 completed:
   *                   type: object
   *                 pending:
   *                   type: object
   *                 byMethod:
   *                   type: object
   *                 byBranch:
   *                   type: object
   *                 dailyRevenue:
   *                   type: array
   *       403:
   *         description: Sin permisos
   */
  async getPaymentStats(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver estadísticas' });
      }

      const { startDate, endDate, branchId } = req.query;
      
      const filters = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (branchId) filters.branchId = branchId;

      const stats = await paymentService.getPaymentStats(filters);
      res.json(stats);
    } catch (error) {
      console.error('Error getting payment stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/payments/pending:
   *   get:
   *     summary: Obtener pagos pendientes
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: branchId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: overdue
   *         schema:
   *           type: boolean
   *         description: Solo mostrar pagos vencidos
   *     responses:
   *       200:
   *         description: Lista de pagos pendientes
   *       403:
   *         description: Sin permisos
   */
  async getPendingPayments(req, res) {
    try {
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver pagos pendientes' });
      }

      const { branchId, overdue } = req.query;
      
      const filters = { status: 'PENDING' };
      if (branchId) filters.branchId = branchId;
      if (overdue === 'true') {
        filters.overdue = true;
      }

      const payments = await paymentService.getPendingPayments(filters);
      res.json(payments);
    } catch (error) {
      console.error('Error getting pending payments:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = paymentController;