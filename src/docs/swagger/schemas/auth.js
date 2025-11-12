/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *       example:
 *         email: "usuario@ejemplo.com"
 *         password: "mi_password"
 * 
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email único del usuario
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Contraseña (mínimo 6 caracteres)
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nombre del usuario
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Apellido del usuario
 *         phone:
 *           type: string
 *           maxLength: 20
 *           description: Teléfono del usuario
 *       example:
 *         email: "nuevo@ejemplo.com"
 *         password: "password_seguro"
 *         firstName: "Juan"
 *         lastName: "Pérez"
 *         phone: "+591 70123456"
 * 
 *     AuthResponse:
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
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT token para autenticación
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp de la respuesta
 *       example:
 *         success: true
 *         message: "Login exitoso"
 *         data:
 *           user:
 *             id: "01234567-89ab-cdef-0123-456789abcdef"
 *             email: "usuario@ejemplo.com"
 *             firstName: "Juan"
 *             lastName: "Pérez"
 *             role: "MEMBER"
 *           token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         timestamp: "2023-01-15T10:30:00.000Z"
 * 
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de actualización
 *       example:
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */