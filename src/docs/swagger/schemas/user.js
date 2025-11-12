/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         firstName:
 *           type: string
 *           description: Nombre del usuario
 *         lastName:
 *           type: string
 *           description: Apellido del usuario
 *         phone:
 *           type: string
 *           description: Teléfono del usuario
 *         photo:
 *           type: string
 *           format: uri
 *           description: URL de la foto de perfil
 *         role:
 *           type: string
 *           enum: [ADMIN, EMPLOYEE, TRAINER, MEMBER]
 *           description: Rol del usuario en el sistema
 *         isActive:
 *           type: boolean
 *           description: Si el usuario está activo
 *         emailVerified:
 *           type: boolean
 *           description: Si el email ha sido verificado
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Fecha del último login
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: "01234567-89ab-cdef-0123-456789abcdef"
 *         email: "usuario@ejemplo.com"
 *         firstName: "Juan"
 *         lastName: "Pérez"
 *         phone: "+591 70123456"
 *         role: "MEMBER"
 *         isActive: true
 *         emailVerified: true
 *         createdAt: "2023-01-15T10:30:00.000Z"
 * 
 *     CreateUser:
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
 *         role:
 *           type: string
 *           enum: [ADMIN, EMPLOYEE, TRAINER, MEMBER]
 *           default: MEMBER
 *           description: Rol del usuario
 *       example:
 *         email: "nuevo@ejemplo.com"
 *         password: "mi_password_seguro"
 *         firstName: "María"
 *         lastName: "García"
 *         phone: "+591 71234567"
 *         role: "MEMBER"
 * 
 *     UpdateUser:
 *       type: object
 *       properties:
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
 *         photo:
 *           type: string
 *           format: uri
 *           description: URL de la foto de perfil
 *         isActive:
 *           type: boolean
 *           description: Estado del usuario
 *       example:
 *         firstName: "María José"
 *         lastName: "García López"
 *         phone: "+591 75555555"
 * 
 *     ChangePassword:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Contraseña actual
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Nueva contraseña (mínimo 6 caracteres)
 *       example:
 *         currentPassword: "password_actual"
 *         newPassword: "nueva_password_segura"
 */