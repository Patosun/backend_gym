const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

/**
 * Middleware de autenticación JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = verifyToken(token);
    
    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
};

/**
 * Middleware de autorización por roles
 * @param {Array} roles - Roles permitidos
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // En caso de error, simplemente continúa sin usuario
    next();
  }
};

/**
 * Middleware para verificar si el usuario es el propietario del recurso
 */
const checkOwnership = (userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (req.user.role === 'ADMIN') {
        // Los admins pueden acceder a cualquier recurso
        return next();
      }

      if (req.user.id !== resourceUserId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar membresía activa
 */
const checkActiveMembership = async (req, res, next) => {
  try {
    if (req.user.role !== 'MEMBER') {
      return next(); // Solo aplicar a miembros
    }

    const member = await prisma.member.findUnique({
      where: { userId: req.user.id },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!member || member.memberships.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Membresía inactiva o expirada'
      });
    }

    req.member = member;
    req.activeMembership = member.memberships[0];
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al verificar membresía',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth,
  checkOwnership,
  checkActiveMembership
};