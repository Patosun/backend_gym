const auditService = require('../../services/auditService');

const auditController = {
  /**
   * @swagger
   * /api/audit/logs:
   *   get:
   *     tags: [Audit]
   *     summary: Obtener logs de auditoría
   *     description: Obtiene logs de auditoría con filtros y paginación. Solo administradores.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *       - in: query
   *         name: entity
   *         schema:
   *           type: string
   *       - in: query
   *         name: entityId
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Logs obtenidos exitosamente
   */
  async getLogs(req, res) {
    try {
      const { page, limit, userId, action, entity, entityId, startDate, endDate } = req.query;

      const filters = {};
      if (userId) filters.userId = userId;
      if (action) filters.action = action;
      if (entity) filters.entity = entity;
      if (entityId) filters.entityId = entityId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await auditService.getLogs(
        filters,
        parseInt(page) || 1,
        parseInt(limit) || 50
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de auditoría',
        error: error.message
      });
    }
  },

  /**
   * @swagger
   * /api/audit/entity/{entity}/{entityId}:
   *   get:
   *     tags: [Audit]
   *     summary: Obtener historial de una entidad
   *     description: Obtiene todo el historial de cambios de una entidad específica
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: entity
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: entityId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Historial obtenido exitosamente
   */
  async getEntityHistory(req, res) {
    try {
      const { entity, entityId } = req.params;
      const { page, limit } = req.query;

      const result = await auditService.getEntityHistory(
        entity,
        entityId,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );

      res.json({
        success: true,
        entity,
        entityId,
        ...result
      });
    } catch (error) {
      console.error('Error getting entity history:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de entidad',
        error: error.message
      });
    }
  },

  /**
   * @swagger
   * /api/audit/user/{userId}:
   *   get:
   *     tags: [Audit]
   *     summary: Obtener actividad de un usuario
   *     description: Obtiene toda la actividad de un usuario específico
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Actividad obtenida exitosamente
   */
  async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      // Verificar permisos: solo el mismo usuario o admin
      if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta actividad'
        });
      }

      const result = await auditService.getUserActivity(
        userId,
        parseInt(page) || 1,
        parseInt(limit) || 50
      );

      res.json({
        success: true,
        userId,
        ...result
      });
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener actividad del usuario',
        error: error.message
      });
    }
  },

  /**
   * @swagger
   * /api/audit/stats:
   *   get:
   *     tags: [Audit]
   *     summary: Obtener estadísticas de auditoría
   *     description: Obtiene estadísticas generales de auditoría
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   */
  async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await auditService.getStats(startDate, endDate);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting audit stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de auditoría',
        error: error.message
      });
    }
  },

  /**
   * @swagger
   * /api/audit/cleanup:
   *   delete:
   *     tags: [Audit]
   *     summary: Limpiar logs antiguos
   *     description: Elimina logs de auditoría más antiguos que el número de días especificado
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 90
   *     responses:
   *       200:
   *         description: Limpieza completada
   */
  async cleanOldLogs(req, res) {
    try {
      const { days } = req.query;
      const daysToKeep = parseInt(days) || 90;

      const result = await auditService.cleanOldLogs(daysToKeep);

      res.json({
        success: true,
        message: 'Logs antiguos eliminados exitosamente',
        ...result
      });
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al limpiar logs antiguos',
        error: error.message
      });
    }
  }
};

module.exports = auditController;
