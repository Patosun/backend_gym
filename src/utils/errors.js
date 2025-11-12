/**
 * Error personalizado para errores de validación de negocio
 */
class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

/**
 * Error de autenticación
 */
class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Error de autorización
 */
class AuthorizationError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Error de recurso no encontrado
 */
class NotFoundError extends Error {
  constructor(message, statusCode = 404) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = statusCode;
  }
}

/**
 * Error de conflicto (duplicados, etc.)
 */
class ConflictError extends Error {
  constructor(message, statusCode = 409) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = statusCode;
  }
}

module.exports = {
  ValidationError,
  AuthError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};