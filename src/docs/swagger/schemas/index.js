/**
 * Índice principal de esquemas de Swagger
 * Este archivo importa y expone todos los esquemas organizados
 */

// Importar todos los esquemas
require('./auth');
require('./user');
require('./member');
require('./branch');
require('./common');

// Importar respuestas
require('../responses/common');

/**
 * Este archivo actúa como punto de entrada para todos los esquemas de Swagger.
 * Los archivos individuales contienen las definiciones específicas de cada entidad.
 * 
 * Estructura:
 * - auth.js: Esquemas de autenticación (login, register, tokens)
 * - user.js: Esquemas de usuarios del sistema
 * - member.js: Esquemas de miembros del gimnasio
 * - branch.js: Esquemas de sucursales
 * - common.js: Esquemas comunes (errores, paginación, respuestas)
 * 
 * Respuestas:
 * - responses/common.js: Respuestas HTTP estándar
 */

module.exports = {
  // Este archivo no exporta nada directamente,
  // solo asegura que todos los esquemas sean cargados
};