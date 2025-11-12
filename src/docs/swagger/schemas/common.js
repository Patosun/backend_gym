/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Siempre false para errores
 *           default: false
 *         message:
 *           type: string
 *           description: Mensaje descriptivo del error
 *         error:
 *           type: string
 *           description: Tipo de error técnico
 *         details:
 *           type: object
 *           description: Detalles adicionales del error
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp del error
 *       example:
 *         success: false
 *         message: "Error en la validación de datos"
 *         error: "ValidationError"
 *         details:
 *           field: "email"
 *           message: "Email inválido"
 *         timestamp: "2024-01-15T10:30:00.000Z"
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           description: Página actual
 *         limit:
 *           type: integer
 *           minimum: 1
 *           description: Elementos por página
 *         total:
 *           type: integer
 *           minimum: 0
 *           description: Total de elementos
 *         totalPages:
 *           type: integer
 *           minimum: 0
 *           description: Total de páginas
 *       example:
 *         page: 1
 *         limit: 10
 *         total: 25
 *         totalPages: 3
 * 
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             type: object
 *           description: Lista de elementos
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *       example:
 *         users: []
 *         pagination:
 *           page: 1
 *           limit: 10
 *           total: 25
 *           totalPages: 3
 * 
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si la operación fue exitosa
 *         message:
 *           type: string
 *           description: Mensaje descriptivo
 *         data:
 *           type: object
 *           description: Datos de respuesta (opcional)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp de la respuesta
 *       example:
 *         success: true
 *         message: "Operación completada exitosamente"
 *         data: {}
 *         timestamp: "2024-01-15T10:30:00.000Z"
 */