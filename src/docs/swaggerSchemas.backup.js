/**
 * @swagger
 * components:
 *   schemas:
 *     # Basic schemas
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         photo:
 *           type: string
 *           format: uri
 *         role:
 *           type: string
 *           enum: [ADMIN, EMPLOYEE, TRAINER, MEMBER]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Member:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         qrCode:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         medicalNotes:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *     Branch:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         openingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         closingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     MembershipType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         durationDays:
 *           type: integer
 *           minimum: 1
 *         price:
 *           type: number
 *           minimum: 0
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         maxClasses:
 *           type: integer
 *           minimum: 0
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     Membership:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipTypeId:
 *           type: string
 *           format: uuid
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, SUSPENDED, CANCELLED]
 *         autoRenew:
 *           type: boolean
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         membershipType:
 *           $ref: '#/components/schemas/MembershipType'
 * 
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           minimum: 0
 *         method:
 *           type: string
 *           enum: [CASH, QR]
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *         description:
 *           type: string
 *         reference:
 *           type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         processedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 * 
 *     Trainer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         specialties:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: integer
 *           minimum: 0
 *         certification:
 *           type: string
 *         hourlyRate:
 *           type: number
 *           minimum: 0
 *         bio:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 * 
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         branchId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         duration:
 *           type: integer
 *           minimum: 1
 *           description: Duración en minutos
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         isRecurring:
 *           type: boolean
 *         price:
 *           type: number
 *           minimum: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 *         trainer:
 *           $ref: '#/components/schemas/Trainer'
 *         reservations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Reservation'
 *         _count:
 *           type: object
 *           properties:
 *             reservations:
 *               type: integer
 * 
 *     Reservation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         classId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         class:
 *           $ref: '#/components/schemas/Class'
 * 
 *     CheckIn:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         memberId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         checkInTime:
 *           type: string
 *           format: date-time
 *         checkOutTime:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: integer
 *           description: Duración en minutos
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         member:
 *           $ref: '#/components/schemas/Member'
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 * 
 *     # Request schemas
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
 *         password:
 *           type: string
 *           minLength: 6
 *         firstName:
 *           type: string
 *           minLength: 1
 *         lastName:
 *           type: string
 *           minLength: 1
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, EMPLOYEE, TRAINER, MEMBER]
 * 
 *     UpdateUser:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *         lastName:
 *           type: string
 *           minLength: 1
 *         phone:
 *           type: string
 *         photo:
 *           type: string
 *           format: uri
 *         isActive:
 *           type: boolean
 * 
 *     CreateMember:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         medicalNotes:
 *           type: string
 * 
 *     UpdateMember:
 *       type: object
 *       properties:
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         medicalNotes:
 *           type: string
 *         isActive:
 *           type: boolean
 * 
 *     CreateBranch:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *         - state
 *         - openingTime
 *         - closingTime
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         address:
 *           type: string
 *           minLength: 1
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         city:
 *           type: string
 *           minLength: 1
 *         state:
 *           type: string
 *           minLength: 1
 *         zipCode:
 *           type: string
 *         openingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         closingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 * 
 *     UpdateBranch:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         address:
 *           type: string
 *           minLength: 1
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         city:
 *           type: string
 *           minLength: 1
 *         state:
 *           type: string
 *           minLength: 1
 *         zipCode:
 *           type: string
 *         openingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         closingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         isActive:
 *           type: boolean
 * 
 *     CreateMembershipType:
 *       type: object
 *       required:
 *         - name
 *         - durationDays
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         durationDays:
 *           type: integer
 *           minimum: 1
 *         price:
 *           type: number
 *           minimum: 0
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         maxClasses:
 *           type: integer
 *           minimum: 0
 * 
 *     UpdateMembershipType:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         durationDays:
 *           type: integer
 *           minimum: 1
 *         price:
 *           type: number
 *           minimum: 0
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         maxClasses:
 *           type: integer
 *           minimum: 0
 *         isActive:
 *           type: boolean
 * 
 *     CreateMembership:
 *       type: object
 *       required:
 *         - memberId
 *         - membershipTypeId
 *         - startDate
 *         - endDate
 *       properties:
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipTypeId:
 *           type: string
 *           format: uuid
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         autoRenew:
 *           type: boolean
 *         notes:
 *           type: string
 * 
 *     UpdateMembership:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, SUSPENDED, CANCELLED]
 *         autoRenew:
 *           type: boolean
 *         notes:
 *           type: string
 * 
 *     CreatePayment:
 *       type: object
 *       required:
 *         - memberId
 *         - branchId
 *         - amount
 *         - method
 *       properties:
 *         memberId:
 *           type: string
 *           format: uuid
 *         membershipId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           minimum: 0.01
 *         method:
 *           type: string
 *           enum: [CASH, QR]
 *         description:
 *           type: string
 *         reference:
 *           type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 * 
 *     UpdatePayment:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *         notes:
 *           type: string
 * 
 *     CreateClass:
 *       type: object
 *       required:
 *         - name
 *         - branchId
 *         - trainerId
 *         - capacity
 *         - duration
 *         - startTime
 *         - endTime
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         branchId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         duration:
 *           type: integer
 *           minimum: 1
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         isRecurring:
 *           type: boolean
 *         price:
 *           type: number
 *           minimum: 0
 * 
 *     UpdateClass:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         branchId:
 *           type: string
 *           format: uuid
 *         trainerId:
 *           type: string
 *           format: uuid
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         duration:
 *           type: integer
 *           minimum: 1
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         isRecurring:
 *           type: boolean
 *         price:
 *           type: number
 *           minimum: 0
 * 
 *     CreateReservation:
 *       type: object
 *       required:
 *         - memberId
 *       properties:
 *         memberId:
 *           type: string
 *           format: uuid
 *         notes:
 *           type: string
 * 
 *     UpdateReservation:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
 *         notes:
 *           type: string
 * 
 *     CreateCheckIn:
 *       type: object
 *       required:
 *         - qrCode
 *         - branchId
 *       properties:
 *         qrCode:
 *           type: string
 *           minLength: 1
 *         branchId:
 *           type: string
 *           format: uuid
 * 
 *     # Response schemas
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           default: false
 *         message:
 *           type: string
 *         error:
 *           type: string
 *         details:
 *           type: object
 *         timestamp:
 *           type: string
 *           format: date-time
 * 
 *   responses:
 *     BadRequest:
 *       description: Solicitud incorrecta
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 * 
 *     Unauthorized:
 *       description: Token de autenticación requerido o inválido
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 * 
 *     Forbidden:
 *       description: Permisos insuficientes para realizar esta operación
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 * 
 *     NotFound:
 *       description: Recurso no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 * 
 *     Conflict:
 *       description: Conflicto con el estado actual del recurso
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 * 
 *     InternalServerError:
 *       description: Error interno del servidor
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 */