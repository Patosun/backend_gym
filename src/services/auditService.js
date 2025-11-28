const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Servicio de Auditoría
 * Registra todas las acciones importantes del sistema
 */
const auditService = {
  /**
   * Registra una acción en el log de auditoría
   * @param {Object} auditData - Datos de la auditoría
   * @param {string} auditData.userId - ID del usuario que realiza la acción
   * @param {string} auditData.action - Acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)
   * @param {string} auditData.entity - Entidad afectada (User, Member, Payment, etc.)
   * @param {string} auditData.entityId - ID de la entidad afectada
   * @param {Object} auditData.oldValues - Valores anteriores (para UPDATE)
   * @param {Object} auditData.newValues - Valores nuevos (para CREATE/UPDATE)
   * @param {string} auditData.ipAddress - IP del cliente
   * @param {string} auditData.userAgent - User agent del navegador
   * @returns {Promise<Object>} Log de auditoría creado
   */
  async log(auditData) {
    try {
      console.log('[AUDIT SERVICE] Intentando crear log:', {
        userId: auditData.userId,
        action: auditData.action,
        entity: auditData.entity,
        entityId: auditData.entityId
      });

      const log = await prisma.auditLog.create({
        data: {
          userId: auditData.userId || null,
          action: auditData.action,
          entity: auditData.entity,
          entityId: auditData.entityId || null,
          oldValues: auditData.oldValues || null,
          newValues: auditData.newValues || null,
          ipAddress: auditData.ipAddress || null,
          userAgent: auditData.userAgent || null,
          timestamp: new Date()
        }
      });

      console.log('[AUDIT SERVICE] Log creado exitosamente:', log.id);
      return log;
    } catch (error) {
      console.error('[AUDIT SERVICE] Error al crear log de auditoría:', error);
      // No lanzamos el error para no interrumpir el flujo principal
      return null;
    }
  },

  /**
   * Registra un evento de autenticación
   */
  async logAuth(userId, action, ipAddress, userAgent, metadata = {}) {
    return this.log({
      userId,
      action,
      entity: 'Auth',
      ipAddress,
      userAgent,
      newValues: metadata
    });
  },

  /**
   * Registra creación de entidad
   */
  async logCreate(userId, entity, entityId, data, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'CREATE',
      entity,
      entityId,
      newValues: this.sanitizeData(data),
      ipAddress,
      userAgent
    });
  },

  /**
   * Registra actualización de entidad
   */
  async logUpdate(userId, entity, entityId, oldData, newData, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      oldValues: this.sanitizeData(oldData),
      newValues: this.sanitizeData(newData),
      ipAddress,
      userAgent
    });
  },

  /**
   * Registra eliminación de entidad
   */
  async logDelete(userId, entity, entityId, oldData, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'DELETE',
      entity,
      entityId,
      oldValues: this.sanitizeData(oldData),
      ipAddress,
      userAgent
    });
  },

  /**
   * Registra un evento personalizado
   */
  async logCustomEvent(userId, action, entity, details, ipAddress, userAgent) {
    return this.log({
      userId,
      action,
      entity,
      newValues: details,
      ipAddress,
      userAgent
    });
  },

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getLogs(filters = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.action) whereClause.action = filters.action;
    if (filters.entity) whereClause.entity = filters.entity;
    if (filters.entityId) whereClause.entityId = filters.entityId;
    
    if (filters.startDate || filters.endDate) {
      whereClause.timestamp = {};
      if (filters.startDate) whereClause.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.timestamp.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: true
        },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Obtiene logs de una entidad específica
   */
  async getEntityHistory(entity, entityId, page = 1, limit = 20) {
    return this.getLogs({ entity, entityId }, page, limit);
  },

  /**
   * Obtiene actividad de un usuario
   */
  async getUserActivity(userId, page = 1, limit = 50) {
    return this.getLogs({ userId }, page, limit);
  },

  /**
   * Sanitiza datos sensibles antes de guardarlos
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'otpSecret',
      'otpCode',
      'token',
      'refreshToken',
      'accessToken'
    ];

    // Remover campos sensibles
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  },

  /**
   * Obtiene estadísticas de auditoría
   */
  async getStats(startDate, endDate) {
    const whereClause = {};
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(startDate);
      if (endDate) whereClause.timestamp.lte = new Date(endDate);
    }

    const [
      totalLogs,
      actionBreakdown,
      entityBreakdown,
      topUsers
    ] = await Promise.all([
      // Total de logs
      prisma.auditLog.count({ where: whereClause }),

      // Distribución por acción
      prisma.auditLog.groupBy({
        by: ['action'],
        where: whereClause,
        _count: true
      }),

      // Distribución por entidad
      prisma.auditLog.groupBy({
        by: ['entity'],
        where: whereClause,
        _count: true
      }),

      // Usuarios más activos
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...whereClause, userId: { not: null } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalLogs,
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action,
        count: item._count
      })),
      entityBreakdown: entityBreakdown.map(item => ({
        entity: item.entity,
        count: item._count
      })),
      topUsers: topUsers.map(item => ({
        userId: item.userId,
        count: item._count
      }))
    };
  },

  /**
   * Limpia logs antiguos (mantenimiento)
   */
  async cleanOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    return {
      deleted: result.count,
      cutoffDate
    };
  }
};

module.exports = auditService;
