const auditService = require('../services/auditService');

/**
 * Middleware de auditoría para requests HTTP
 * Registra automáticamente las acciones en el sistema
 */
const auditMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const startTime = Date.now();

    // Obtener información del request
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id || null;
    const method = req.method;
    const path = req.path;

    // Capturar la respuesta para auditoría
    res.json = function(data) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Solo auditar operaciones exitosas de modificación
      if (statusCode >= 200 && statusCode < 300 && shouldAudit(method, path, options)) {
        // Ejecutar auditoría de forma asíncrona sin bloquear la respuesta
        setImmediate(() => {
          try {
            const auditData = extractAuditData(req, data, method, path);
            if (auditData) {
              auditService.log({
                userId,
                action: auditData.action,
                entity: auditData.entity,
                entityId: auditData.entityId,
                oldValues: auditData.oldValues,
                newValues: auditData.newValues,
                ipAddress,
                userAgent
              });
            }
          } catch (error) {
            console.error('Error en auditoría automática:', error);
          }
        });
      }

      // Enviar respuesta original
      return originalJson(data);
    };

    next();
  };
};

/**
 * Determina si la ruta debe ser auditada
 */
function shouldAudit(method, path, options) {
  // Excluir rutas específicas
  const excludePaths = options.exclude || [
    '/health',
    '/api-docs',
    '/api/auth/refresh'
  ];

  if (excludePaths.some(excluded => path.startsWith(excluded))) {
    return false;
  }

  // Solo auditar operaciones de modificación
  const auditMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return auditMethods.includes(method);
}

/**
 * Extrae datos de auditoría del request y response
 */
function extractAuditData(req, responseData, method, path) {
  const pathParts = path.split('/').filter(p => p);
  
  // Determinar entidad y acción basado en la ruta
  let entity = null;
  let action = null;
  let entityId = null;
  let newValues = null;
  let oldValues = null;

  // Mapeo de rutas a entidades
  const entityMap = {
    'users': 'User',
    'members': 'Member',
    'employees': 'Employee',
    'trainers': 'Trainer',
    'branches': 'Branch',
    'memberships': 'Membership',
    'membership-types': 'MembershipType',
    'payments': 'Payment',
    'classes': 'Class',
    'reservations': 'Reservation',
    'checkins': 'CheckIn'
  };

  // Identificar entidad de la ruta
  for (const [route, entityName] of Object.entries(entityMap)) {
    if (pathParts.includes(route)) {
      entity = entityName;
      break;
    }
  }

  if (!entity) return null;

  // Determinar acción según el método HTTP
  switch (method) {
    case 'POST':
      action = 'CREATE';
      newValues = req.body;
      // Intentar obtener ID de la respuesta
      if (responseData && responseData.data && responseData.data.id) {
        entityId = responseData.data.id;
      } else if (responseData && responseData.id) {
        entityId = responseData.id;
      }
      break;
    
    case 'PUT':
    case 'PATCH':
      action = 'UPDATE';
      entityId = req.params.id;
      newValues = req.body;
      // oldValues se obtendría del before-hook si estuviera implementado
      break;
    
    case 'DELETE':
      action = 'DELETE';
      entityId = req.params.id;
      break;
  }

  // Casos especiales
  if (path.includes('/login')) {
    entity = 'Auth';
    action = 'LOGIN';
    newValues = { email: req.body.email };
  } else if (path.includes('/logout')) {
    entity = 'Auth';
    action = 'LOGOUT';
  } else if (path.includes('/register')) {
    entity = 'User';
    action = 'REGISTER';
    newValues = { email: req.body.email, role: req.body.role };
  } else if (path.includes('/cancel')) {
    action = 'CANCEL';
  } else if (path.includes('/confirm')) {
    action = 'CONFIRM';
  } else if (path.includes('/check-in')) {
    entity = 'CheckIn';
    action = 'CHECK_IN';
  } else if (path.includes('/check-out')) {
    entity = 'CheckIn';
    action = 'CHECK_OUT';
  }

  return {
    entity,
    action,
    entityId,
    oldValues,
    newValues
  };
}

/**
 * Middleware específico para auditar autenticación
 */
const auditAuth = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      const statusCode = res.statusCode;
      
      if (statusCode >= 200 && statusCode < 300) {
        setImmediate(() => {
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'];
          const userId = req.user?.id || data?.user?.id || null;
          
          auditService.logAuth(
            userId,
            action,
            ipAddress,
            userAgent,
            {
              email: req.body?.email,
              success: true
            }
          );
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Helper para auditar manualmente en controladores
 */
const audit = {
  /**
   * Auditar creación
   */
  create: async (req, entity, entityId, data) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id;
    
    return auditService.logCreate(
      userId,
      entity,
      entityId,
      data,
      ipAddress,
      userAgent
    );
  },

  /**
   * Auditar actualización
   */
  update: async (req, entity, entityId, oldData, newData) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id;
    
    return auditService.logUpdate(
      userId,
      entity,
      entityId,
      oldData,
      newData,
      ipAddress,
      userAgent
    );
  },

  /**
   * Auditar eliminación
   */
  delete: async (req, entity, entityId, oldData) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id;
    
    return auditService.logDelete(
      userId,
      entity,
      entityId,
      oldData,
      ipAddress,
      userAgent
    );
  },

  /**
   * Auditar evento personalizado
   */
  log: async (req, action, entity, details) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id;
    
    return auditService.logCustomEvent(
      userId,
      action,
      entity,
      details,
      ipAddress,
      userAgent
    );
  }
};

module.exports = {
  auditMiddleware,
  auditAuth,
  audit
};
