/**
 * @swagger
 * components:
 *   schemas:
 *     Branch:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - address
 *         - phone
 *         - email
 *         - openTime
 *         - closeTime
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único de la sucursal
 *         name:
 *           type: string
 *           description: Nombre de la sucursal
 *         address:
 *           type: string
 *           description: Dirección completa
 *         phone:
 *           type: string
 *           description: Teléfono de contacto
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contacto
 *         openTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Hora de apertura (HH:mm)
 *         closeTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Hora de cierre (HH:mm)
 *         isActive:
 *           type: boolean
 *           description: Si la sucursal está activa
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *       example:
 *         id: "01234567-89ab-cdef-0123-456789abcdef"
 *         name: "GymMaster Centro"
 *         address: "Av. Libertad 123, Santa Cruz"
 *         phone: "+591 3-1234567"
 *         email: "centro@gymmaster.com"
 *         openTime: "06:00"
 *         closeTime: "22:00"
 *         isActive: true
 * 
 *     CreateBranch:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - phone
 *         - email
 *         - openTime
 *         - closeTime
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: Nombre de la sucursal
 *         address:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Dirección completa
 *         phone:
 *           type: string
 *           maxLength: 20
 *           description: Teléfono de contacto
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contacto
 *         openTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Hora de apertura (HH:mm)
 *         closeTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Hora de cierre (HH:mm)
 *       example:
 *         name: "GymMaster Norte"
 *         address: "Av. Santos Dumont 456, Santa Cruz"
 *         phone: "+591 3-7654321"
 *         email: "norte@gymmaster.com"
 *         openTime: "05:30"
 *         closeTime: "23:00"
 * 
 *     UpdateBranch:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: Nombre de la sucursal
 *         address:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Dirección completa
 *         phone:
 *           type: string
 *           maxLength: 20
 *           description: Teléfono de contacto
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contacto
 *         openTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Hora de apertura (HH:mm)
 *         closeTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Hora de cierre (HH:mm)
 *         isActive:
 *           type: boolean
 *           description: Estado de la sucursal
 *       example:
 *         name: "GymMaster Norte - Renovado"
 *         openTime: "05:00"
 *         closeTime: "23:30"
 */