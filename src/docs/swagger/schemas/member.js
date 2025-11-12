/**
 * @swagger
 * components:
 *   schemas:
 *     Member:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - membershipNumber
 *         - qrCode
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del miembro
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID del usuario asociado
 *         membershipNumber:
 *           type: string
 *           description: Número único de membresía
 *         qrCode:
 *           type: string
 *           description: Código QR único para check-in
 *         qrCodeExpiry:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración del código QR
 *         joinDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de ingreso al gimnasio
 *         emergencyContact:
 *           type: string
 *           description: Nombre del contacto de emergencia
 *         emergencyPhone:
 *           type: string
 *           description: Teléfono del contacto de emergencia
 *         medicalConditions:
 *           type: string
 *           description: Condiciones médicas importantes
 *         isActive:
 *           type: boolean
 *           description: Si el miembro está activo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         user:
 *           $ref: '#/components/schemas/User'
 *         memberships:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Membership'
 *       example:
 *         id: "01234567-89ab-cdef-0123-456789abcdef"
 *         userId: "98765432-10ab-cdef-9876-543210fedcba"
 *         membershipNumber: "GM-2024-0001"
 *         qrCode: "QR123456789"
 *         joinDate: "2024-01-15T00:00:00.000Z"
 *         emergencyContact: "María Pérez"
 *         emergencyPhone: "+591 71234567"
 *         isActive: true
 * 
 *     CreateMember:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID del usuario que será miembro
 *         emergencyContact:
 *           type: string
 *           maxLength: 200
 *           description: Nombre del contacto de emergencia
 *         emergencyPhone:
 *           type: string
 *           maxLength: 20
 *           description: Teléfono del contacto de emergencia
 *         medicalConditions:
 *           type: string
 *           maxLength: 1000
 *           description: Condiciones médicas importantes
 *       example:
 *         userId: "98765432-10ab-cdef-9876-543210fedcba"
 *         emergencyContact: "María Pérez"
 *         emergencyPhone: "+591 71234567"
 *         medicalConditions: "Ninguna conocida"
 * 
 *     UpdateMember:
 *       type: object
 *       properties:
 *         emergencyContact:
 *           type: string
 *           maxLength: 200
 *           description: Nombre del contacto de emergencia
 *         emergencyPhone:
 *           type: string
 *           maxLength: 20
 *           description: Teléfono del contacto de emergencia
 *         medicalConditions:
 *           type: string
 *           maxLength: 1000
 *           description: Condiciones médicas importantes
 *         isActive:
 *           type: boolean
 *           description: Estado del miembro
 *       example:
 *         emergencyContact: "Carlos Pérez"
 *         emergencyPhone: "+591 75555555"
 *         medicalConditions: "Alergia al polen"
 */