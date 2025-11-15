const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const emailService = require('./emailService'); // Gmail SMTP real
// const emailService = require('./mockEmailService'); // Mock para desarrollo

const prisma = new PrismaClient();

class TwoFactorService {
  
  /**
   * Habilitar 2FA para un usuario
   */
  async enable2FA(userId) {
    try {
      // Generar secret único para el usuario
      const secret = crypto.randomBytes(32).toString('hex');
      
      // Actualizar usuario en la base de datos
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          is2FAEnabled: true,
          otpSecret: secret
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          is2FAEnabled: true
        }
      });

      // Enviar email de bienvenida
      await emailService.send2FAWelcomeEmail(
        user.email, 
        `${user.firstName} ${user.lastName}`
      );

      return {
        success: true,
        message: '2FA habilitado exitosamente',
        user: {
          id: user.id,
          is2FAEnabled: user.is2FAEnabled
        }
      };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw new Error('Error al habilitar 2FA');
    }
  }

  /**
   * Deshabilitar 2FA para un usuario
   */
  async disable2FA(userId) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          is2FAEnabled: false,
          otpSecret: null,
          otpCode: null,
          otpExpiry: null
        },
        select: {
          id: true,
          is2FAEnabled: true
        }
      });

      return {
        success: true,
        message: '2FA deshabilitado exitosamente',
        user: {
          id: user.id,
          is2FAEnabled: user.is2FAEnabled
        }
      };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw new Error('Error al deshabilitar 2FA');
    }
  }

  /**
   * Generar y enviar código OTP
   */
  async generateAndSendOTP(userId) {
    try {
      console.log(`🔐 [generateAndSendOTP] INICIANDO para usuario: ${userId}`);
      console.log(`🔐 [generateAndSendOTP] Stack trace:`, new Error().stack);
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          is2FAEnabled: true,
          otpSecret: true
        }
      });

      if (!user) {
        console.log(`❌ Usuario no encontrado: ${userId}`);
        throw new Error('Usuario no encontrado');
      }

      console.log(`📋 Usuario encontrado - 2FA habilitado: ${user.is2FAEnabled}`);

      if (!user.is2FAEnabled) {
        throw new Error('2FA no está habilitado para este usuario');
      }

      // PRIMERO: Limpiar cualquier código anterior
      console.log('🧹 Limpiando códigos OTP anteriores...');
      await prisma.user.update({
        where: { id: userId },
        data: {
          otpCode: null,
          otpExpiry: null
        }
      });

      // SEGUNDO: Generar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + parseInt(process.env.OTP_EXPIRATION_MINUTES || 10));

      console.log(`🔑 Código OTP generado: ${otpCode}`);
      console.log(`⏰ Expira el: ${expirationTime.toISOString()}`);

      // Guardar código en la base de datos ANTES de enviarlo
      console.log('💾 Guardando código en base de datos...');
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          otpCode: otpCode,
          otpExpiry: expirationTime
        }
      });

      console.log(`✅ Código guardado en BD. OTP en BD: ${updatedUser.otpCode}`);

      // Enviar el MISMO código por email
      console.log(`📧 Enviando código por email: ${otpCode}`);
      const emailSent = await emailService.sendOTP(
        user.email,
        otpCode, // Usar exactamente el mismo código que se guardó en BD
        `${user.firstName} ${user.lastName}`
      );

      if (emailSent) {
        console.log('✅ Email enviado exitosamente');
      } else {
        console.log('❌ Error enviando email');
      }

      return {
        success: true,
        message: 'Código OTP enviado exitosamente',
        expiresAt: expirationTime
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new Error(error.message || 'Error al generar código OTP');
    }
  }

  /**
   * Verificar código OTP
   */
  async verifyOTP(userId, inputOTP) {
    try {
      console.log(`🔍 Verificando OTP para usuario: ${userId}`);
      console.log(`🔐 Código ingresado: ${inputOTP}`);
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          otpCode: true,
          otpExpiry: true,
          is2FAEnabled: true
        }
      });

      if (!user) {
        console.log('❌ Usuario no encontrado');
        throw new Error('Usuario no encontrado');
      }

      console.log(`📋 Usuario encontrado - 2FA habilitado: ${user.is2FAEnabled}`);
      console.log(`🔑 Código en BD: ${user.otpCode}`);
      console.log(`⏰ Expira: ${user.otpExpiry}`);

      if (!user.is2FAEnabled) {
        throw new Error('2FA no está habilitado para este usuario');
      }

      if (!user.otpCode) {
        console.log('❌ No hay código OTP en BD');
        throw new Error('No hay código OTP pendiente');
      }

      // Verificar si el código ha expirado
      const now = new Date();
      if (now > user.otpExpiry) {
        console.log(`❌ Código expirado. Ahora: ${now.toISOString()}, Expira: ${user.otpExpiry.toISOString()}`);
        // Limpiar código expirado
        await this.clearOTP(userId);
        throw new Error('El código OTP ha expirado');
      }

      // Verificar si el código coincide
      if (user.otpCode !== inputOTP) {
        console.log(`❌ Código incorrecto. Esperado: ${user.otpCode}, Recibido: ${inputOTP}`);
        throw new Error('Código OTP inválido');
      }

      console.log('✅ Código OTP verificado exitosamente');

      // Código válido - limpiar de la base de datos
      console.log('🧹 Limpiando código OTP de la base de datos...');
      await this.clearOTP(userId);
      console.log('✅ Código OTP limpiado completamente');

      return {
        success: true,
        message: 'Código OTP verificado exitosamente'
      };
    } catch (error) {
      console.error('❌ [verifyOTP] Error:', error.message);
      console.error('❌ [verifyOTP] Stack:', error.stack);
      throw new Error(error.message || 'Error al verificar código OTP');
    }
  }

  /**
   * Limpiar código OTP de la base de datos
   */
  async clearOTP(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          otpCode: null,
          otpExpiry: null
        }
      });
    } catch (error) {
      console.error('Error clearing OTP:', error);
    }
  }

  /**
   * Verificar si un usuario tiene 2FA habilitado
   */
  async is2FAEnabled(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { is2FAEnabled: true }
      });

      return user?.is2FAEnabled || false;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Limpiar códigos OTP expirados (tarea de limpieza)
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await prisma.user.updateMany({
        where: {
          otpExpiry: {
            lt: new Date()
          },
          otpCode: {
            not: null
          }
        },
        data: {
          otpCode: null,
          otpExpiry: null
        }
      });

      console.log(`🧹 Limpieza OTP: ${result.count} códigos expirados eliminados`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning expired OTPs:', error);
      return 0;
    }
  }
}

module.exports = new TwoFactorService();