const { ZodError } = require('zod');
const { ValidationError, AuthError, AuthorizationError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Middleware de validación usando Zod
 * @param {Object} schema - Schema de validación Zod
 * @param {String} source - Fuente de datos (body, params, query)
 */
const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      req[source] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Errores personalizados de la aplicación
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof ConflictError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Error de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con esos datos únicos',
      error: 'Duplicate entry'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro no encontrado',
      error: 'Record not found'
    });
  }

  // Error de validación de Zod
  if (err instanceof ZodError) {
    const errors = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error personalizado con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Error interno del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
};

/**
 * Middleware para sanitizar entrada
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remover caracteres potencialmente peligrosos
        obj[key] = obj[key].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

/**
 * Wrapper para funciones async para capturar errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${req.ip}`
    );
  });
  
  next();
};

module.exports = {
  validateSchema,
  errorHandler,
  notFound,
  sanitizeInput,
  asyncHandler,
  requestLogger
};