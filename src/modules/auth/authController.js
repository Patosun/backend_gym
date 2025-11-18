const authService = require('./authService');
const twoFactorService = require('../../services/twoFactorService');
const { asyncHandler } = require('../../middlewares/validation');

class AuthController {
  /**
   * @desc    Verificar disponibilidad de email
   * @route   POST /api/auth/check-email
   * @access  Public
   */
  checkEmailAvailability = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const isAvailable = await authService.checkEmailAvailability(email);
    
    res.json({
      success: true,
      data: {
        email,
        available: isAvailable
      },
      message: isAvailable ? 'Email disponible' : 'Email ya registrado'
    });
  });

  /**
   * @desc    Registrar nuevo usuario
   * @route   POST /api/auth/register
   * @access  Public
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @desc    Iniciar sesión
   * @route   POST /api/auth/login
   * @access  Public
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Verificar si el usuario tiene 2FA habilitado
    const is2FAEnabled = await twoFactorService.is2FAEnabled(result.user.id);
    
    if (is2FAEnabled) {
      // Generar y enviar código OTP
      console.log('🔐 [LOGIN] Llamando generateAndSendOTP desde login');
      await twoFactorService.generateAndSendOTP(result.user.id);
      
      // Responder indicando que se requiere OTP
      res.json({
        success: true,
        requires2FA: true,
        message: 'Código de verificación enviado por email',
        data: {
          userId: result.user.id,
          email: result.user.email
        }
      });
    } else {
      // Login normal sin 2FA
      res.json({
        success: true,
        requires2FA: false,
        message: 'Login exitoso',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    }
  });

  /**
   * @desc    Obtener perfil del usuario autenticado
   * @route   GET /api/auth/profile
   * @access  Private
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  });

  /**
   * @desc    Actualizar perfil del usuario
   * @route   PUT /api/auth/profile
   * @access  Private
   */
  updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
    });
  });

  /**
   * @desc    Debug - Verificar cookies
   * @route   GET /api/auth/debug-cookies
   * @access  Public
   */
  debugCookies = asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        cookies: req.cookies,
        headers: {
          authorization: req.headers.authorization,
          cookie: req.headers.cookie
        }
      }
    });
  });

  /**
   * @desc    Cambiar contraseña
   * @route   PUT /api/auth/change-password
   * @access  Private
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: result.message
    });
  });

  /**
   * @desc    Generar nuevo código QR
   * @route   POST /api/auth/generate-qr
   * @access  Private (Member only)
   */
  generateQRCode = asyncHandler(async (req, res) => {
    const result = await authService.generateNewQRCode(req.user.id);
    
    res.json({
      success: true,
      message: 'Código QR generado exitosamente',
      data: result
    });
  });

  /**
   * @desc    Refrescar access token
   * @route   POST /api/auth/refresh
   * @access  Public (con refresh token)
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || refreshToken // Si no se genera nuevo refresh token, devolver el actual
      }
    });
  });

  /**
   * @desc    Cerrar sesión (revocar refresh token)
   * @route   POST /api/auth/logout
   * @access  Public
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const refreshTokenFromCookie = req.cookies?.refreshToken;
    const tokenToUse = refreshToken || refreshTokenFromCookie;

    if (tokenToUse) {
      await authService.revokeRefreshToken(tokenToUse);
    }

    // Limpiar cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  });

  /**
   * @desc    Cerrar todas las sesiones
   * @route   POST /api/auth/logout-all
   * @access  Private
   */
  logoutAll = asyncHandler(async (req, res) => {
    const result = await authService.revokeAllUserTokens(req.user.id);
    
    // Limpiar cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: result.message
    });
  });

  /**
   * @desc    Verificar código OTP para 2FA
   * @route   POST /api/auth/verify-otp
   * @access  Public
   */
  verifyOTP = asyncHandler(async (req, res) => {
    const { userId, otpCode } = req.body;
    
    // Verificar el código OTP
    await twoFactorService.verifyOTP(userId, otpCode);
    
    // Obtener datos completos del usuario para generar tokens
    const result = await authService.getUserById(userId);
    
    res.json({
      success: true,
      message: 'Verificación 2FA exitosa',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @desc    Habilitar 2FA para el usuario autenticado
   * @route   POST /api/auth/enable-2fa
   * @access  Private
   */
  enable2FA = asyncHandler(async (req, res) => {
    const result = await twoFactorService.enable2FA(req.user.id);
    
    res.json({
      success: true,
      message: result.message,
      data: result.user
    });
  });

  /**
   * @desc    Deshabilitar 2FA para el usuario autenticado
   * @route   POST /api/auth/disable-2fa
   * @access  Private
   */
  disable2FA = asyncHandler(async (req, res) => {
    const result = await twoFactorService.disable2FA(req.user.id);
    
    res.json({
      success: true,
      message: result.message,
      data: result.user
    });
  });

  /**
   * @desc    Reenviar código OTP
   * @route   POST /api/auth/resend-otp
   * @access  Public
   */
  resendOTP = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    
    console.log('🔐 [RESEND] Llamando generateAndSendOTP desde resend');
    const result = await twoFactorService.generateAndSendOTP(userId);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        expiresAt: result.expiresAt
      }
    });
  });

  /**
   * @desc    Solicitar restablecimiento de contraseña
   * @route   POST /api/auth/forgot-password
   * @access  Public
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'El email es requerido'
      });
    }

    const result = await authService.forgotPassword(email);
    
    res.json({
      success: true,
      message: result.message
    });
  });

  /**
   * @desc    Verificar token de restablecimiento
   * @route   POST /api/auth/verify-reset-token
   * @access  Public
   */
  verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token es requerido'
      });
    }

    const result = await authService.verifyResetToken(token);
    
    res.json({
      success: true,
      message: result.message
    });
  });

  /**
   * @desc    Restablecer contraseña
   * @route   POST /api/auth/reset-password
   * @access  Public
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token y nueva contraseña son requeridos'
      });
    }

    const result = await authService.resetPassword(token, newPassword);
    
    res.json({
      success: true,
      message: result.message
    });
  });

  /**
   * @desc    Habilitar 2FA para un usuario (Admin)
   * @route   POST /api/auth/enable-2fa-admin
   * @access  Private (Admin only)
   */
  enable2FAAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario es requerido'
      });
    }

    const result = await authService.enable2FAAdmin(userId);
    
    res.json({
      success: true,
      message: result.message
    });
  });

  /**
   * @desc    Deshabilitar 2FA para un usuario (Admin)
   * @route   POST /api/auth/disable-2fa-admin
   * @access  Private (Admin only)
   */
  disable2FAAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario es requerido'
      });
    }

    const result = await authService.disable2FAAdmin(userId);
    
    res.json({
      success: true,
      message: result.message
    });
  });
}

module.exports = new AuthController();