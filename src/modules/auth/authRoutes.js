const express = require('express');
const authController = require('./authController');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const { validateSchema } = require('../../middlewares/validation');
const {
  userCreateSchema,
  loginSchema,
  userUpdateSchema,
  checkEmailSchema,
  refreshTokenSchema
} = require('../../utils/zodSchemas');

const router = express.Router();

/**
 * @swagger
 * /api/auth/check-email:
 *   post:
 *     summary: Verificar disponibilidad de email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email disponible
 *       409:
 *         description: Email ya registrado
 */
router.post('/check-email', validateSchema(checkEmailSchema), authController.checkEmailAvailability);

// Debug endpoint (solo para desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug-cookies', authController.debugCookies);
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario en el sistema
 *     description: Crea una nueva cuenta de usuario y asigna el rol correspondiente (MEMBER, EMPLOYEE, TRAINER, ADMIN)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             member:
 *               summary: Registrar miembro
 *               value:
 *                 email: "juan.perez@gmail.com"
 *                 password: "mi_password_123"
 *                 firstName: "Juan"
 *                 lastName: "Pérez"
 *                 phone: "+591 70123456"
 *                 role: "MEMBER"
 *             employee:
 *               summary: Registrar empleado
 *               value:
 *                 email: "maria.garcia@gymmaster.com"
 *                 password: "password_seguro"
 *                 firstName: "María"
 *                 lastName: "García"
 *                 phone: "+591 71234567"
 *                 role: "EMPLOYEE"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register', validateSchema(userCreateSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validateSchema(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refrescar access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: Refresh token inválido
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión actual
 *     description: Cierra la sesión actual revocando el refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso
 *       400:
 *         description: No hay refresh token
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Cerrar todas las sesiones
 *     description: Cierra todas las sesiones del usuario revocando todos sus refresh tokens
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesiones cerradas exitosamente
 *       400:
 *         description: No hay refresh token
 */
router.post('/logout-all', authController.logoutAll);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       401:
 *         description: No autorizado
 */
router.put('/profile', authenticateToken, validateSchema(userUpdateSchema), authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       401:
 *         description: No autorizado
 */
router.put('/change-password', authenticateToken, authController.changePassword);

/**
 * @swagger
 * /api/auth/generate-qr:
 *   post:
 *     summary: Generar nuevo código QR
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código QR generado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo para miembros
 */
router.post('/generate-qr', authenticateToken, authorize(['MEMBER']), authController.generateQRCode);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 */
router.post('/logout-session', authenticateToken, authController.logout);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verificar código OTP para 2FA
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otpCode
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               otpCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Código verificado exitosamente
 *       400:
 *         description: Código inválido o expirado
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Reenviar código OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Código reenviado exitosamente
 */
router.post('/resend-otp', authController.resendOTP);

/**
 * @swagger
 * /api/auth/enable-2fa:
 *   post:
 *     summary: Habilitar autenticación de dos factores
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA habilitado exitosamente
 */
router.post('/enable-2fa', authenticateToken, authController.enable2FA);

/**
 * @swagger
 * /api/auth/disable-2fa:
 *   post:
 *     summary: Deshabilitar autenticación de dos factores
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA deshabilitado exitosamente
 */
router.post('/disable-2fa', authenticateToken, authController.disable2FA);

module.exports = router;