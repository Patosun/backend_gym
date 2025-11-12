/**
 * @swagger
 * components:
 *   responses:
 *     BadRequest:
 *       description: Solicitud incorrecta - Datos inválidos o faltantes
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Datos de entrada inválidos"
 *             error: "Validation failed"
 *             details:
 *               field: "email"
 *               message: "Email inválido"
 *             timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     Unauthorized:
 *       description: Token de autenticación requerido o inválido
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Token de autenticación requerido"
 *             error: "Unauthorized"
 *             timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     Forbidden:
 *       description: Permisos insuficientes para realizar esta operación
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "No tienes permisos para realizar esta acción"
 *             error: "Forbidden"
 *             timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     NotFound:
 *       description: Recurso no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Recurso no encontrado"
 *             error: "Not found"
 *             timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     Conflict:
 *       description: Conflicto con el estado actual del recurso (ej. email ya registrado)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "El email ya está registrado"
 *             error: "Conflict"
 *             timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     InternalServerError:
 *       description: Error interno del servidor
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Error interno del servidor"
 *             error: "Internal server error"
 *             timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     Success:
 *       description: Operación exitosa
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 description: Indica si la operación fue exitosa
 *               message:
 *                 type: string
 *                 description: Mensaje descriptivo
 *               data:
 *                 type: object
 *                 description: Datos de respuesta
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp de la respuesta
 *           example:
 *             success: true
 *             message: "Operación completada exitosamente"
 *             data: {}
 *             timestamp: "2024-01-15T10:30:00.000Z"
 */