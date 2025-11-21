const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateTokenPair, verifyRefreshToken } = require('../../utils/jwt');
const { AuthError, ValidationError, ConflictError, NotFoundError } = require('../../utils/errors');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../../services/emailService');

class AuthService {
  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    return !existingUser; // true si está disponible, false si ya existe
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    const { email, password, firstName, lastName, phone, role = 'MEMBER' } = userData;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

    // Verificar si ya existe un usuario con el mismo nombre completo y teléfono (evitar duplicados)
    if (phone) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { firstName: { equals: firstName, mode: 'insensitive' } },
            { lastName: { equals: lastName, mode: 'insensitive' } },
            { phone }
          ]
        }
      });

      if (duplicateUser) {
        throw new ConflictError('Ya existe un usuario con el mismo nombre y teléfono');
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Para roles que requieren branchId, asegurar que exista uno válido
    let defaultBranchId = null;
    if (['EMPLOYEE', 'ADMIN', 'TRAINER'].includes(role) && !userData.branchId) {
      const defaultBranch = await prisma.branch.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      
      if (!defaultBranch) {
        throw new ValidationError('No hay sucursales disponibles. Contacte al administrador.');
      }
      
      defaultBranchId = defaultBranch.id;
    }

    try {
      // Crear usuario en una transacción
      const result = await prisma.$transaction(async (prisma) => {
        // Crear usuario
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone?.trim(),
            role,
            emailVerified: false, // Por defecto no verificado
            isActive: true
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true
          }
        });

        // Crear registros adicionales según el rol
        if (role === 'MEMBER') {
          const membershipNumber = `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          const qrCode = uuidv4();
          const qrCodeExpiry = new Date();
          qrCodeExpiry.setDate(qrCodeExpiry.getDate() + 30); // QR válido por 30 días

          await prisma.member.create({
            data: {
              userId: user.id,
              membershipNumber,
              dateOfBirth: userData.dateOfBirth || null,
              emergencyContact: userData.emergencyContact || null,
              emergencyPhone: userData.emergencyPhone || null,
              medicalNotes: userData.medicalNotes || null,
              qrCode,
              qrCodeExpiry,
              joinDate: new Date(),
              isActive: true
            }
          });

          // Agregar información del member al usuario
          user.member = {
            membershipNumber,
            qrCode,
            joinDate: new Date()
          };
        } else if (role === 'EMPLOYEE' || role === 'ADMIN') {
          // Para empleados y admins, crear registro de empleado
          await prisma.employee.create({
            data: {
              userId: user.id,
              branchId: userData.branchId || defaultBranchId,
              position: userData.position || (role === 'ADMIN' ? 'Administrador' : 'Empleado'),
              salary: userData.salary || 0,
              hireDate: new Date(),
              isActive: true
            }
          });
        } else if (role === 'TRAINER') {
          // Para entrenadores, crear registro de trainer
          await prisma.trainer.create({
            data: {
              userId: user.id,
              branchId: userData.branchId || defaultBranchId,
              specialties: userData.specialties || [],
              experience: userData.experience || 0,
              certification: userData.certification || '',
              hourlyRate: userData.hourlyRate || 0,
              bio: userData.bio || '',
              isActive: true
            }
          });
        }

        return user;
      });

      // Generar par de tokens (access + refresh)
      const { accessToken, refreshToken } = generateTokenPair({ 
        userId: result.id, 
        role: result.role,
        email: result.email 
      });

      // Guardar refresh token en la base de datos
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 días

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: result.id,
          expiresAt: refreshTokenExpiry
        }
      });

      // Log del registro exitoso
      console.log(`✅ Usuario registrado exitosamente: ${result.email} (${result.role})`);

      return {
        user: result,
        accessToken,
        refreshToken,
        message: `Bienvenido ${result.firstName}! Tu cuenta ha sido creada exitosamente.`
      };

    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      // Si es un error de Prisma por constraaint único
      if (error.code === 'P2002') {
        throw new ConflictError('Ya existe un usuario con estos datos');
      }
      
      throw new ValidationError('Error al crear el usuario');
    }
  }

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        member: true,
        employee: {
          include: { branch: true }
        },
        trainer: {
          include: { branch: true }
        }
      }
    });

    if (!user) {
      throw new AuthError('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new AuthError('Cuenta inactiva');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AuthError('Credenciales inválidas');
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Limpiar refresh tokens antiguos del usuario (opcional, para mantener limpia la DB)
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { expiresAt: { lt: new Date() } }, // Expirados
          { isRevoked: true } // Revocados
        ]
      }
    });

    // Generar par de tokens (access + refresh)
    const { accessToken, refreshToken } = generateTokenPair({ 
      userId: user.id, 
      role: user.role,
      email: user.email 
    });

    // Guardar refresh token en la base de datos
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry
      }
    });

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  /**
   * Obtener perfil del usuario
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: {
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { membershipType: true }
            }
          }
        },
        employee: {
          include: { branch: true }
        },
        trainer: {
          include: { branch: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Remover la contraseña del resultado
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Obtener usuario por ID con tokens (para 2FA)
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
        employee: {
          include: { branch: true }
        },
        trainer: {
          include: { branch: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokenPair({ 
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Guardar refresh token en la base de datos
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry
      }
    });

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  /**
   * Actualizar perfil
   */
  async updateProfile(userId, updateData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return user;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthError('Contraseña actual incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Generar nuevo QR code para miembro
   */
  async generateNewQRCode(userId) {
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      throw new NotFoundError('Miembro no encontrado');
    }

    const qrCode = uuidv4();
    const qrCodeExpiry = new Date();
    qrCodeExpiry.setHours(qrCodeExpiry.getHours() + parseInt(process.env.QR_EXPIRATION_HOURS) || 24);

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        qrCode,
        qrCodeExpiry
      }
    });

    return {
      qrCode: updatedMember.qrCode,
      qrCodeExpiry: updatedMember.qrCodeExpiry
    };
  }

  /**
   * Refrescar access token usando refresh token
   */
  async refreshAccessToken(refreshTokenString) {
    try {
      // Verificar el refresh token
      const decoded = verifyRefreshToken(refreshTokenString);

      // Buscar el refresh token en la base de datos
      const refreshTokenRecord = await prisma.refreshToken.findFirst({
        where: {
          token: refreshTokenString,
          isRevoked: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true
            }
          }
        }
      });

      if (!refreshTokenRecord) {
        throw new AuthError('Refresh token inválido o expirado');
      }

      // Verificar que el usuario esté activo
      if (!refreshTokenRecord.user.isActive) {
        // Revocar el refresh token si el usuario está inactivo
        await prisma.refreshToken.update({
          where: { id: refreshTokenRecord.id },
          data: { isRevoked: true }
        });
        throw new AuthError('Cuenta inactiva');
      }

      // Generar nuevo access token
      const { accessToken } = generateTokenPair({
        userId: refreshTokenRecord.user.id,
        role: refreshTokenRecord.user.role,
        email: refreshTokenRecord.user.email
      });

      return {
        accessToken,
        user: refreshTokenRecord.user
      };

    } catch (error) {
      console.error('❌ Error refrescando token:', error.message);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Error al refrescar token');
    }
  }

  /**
   * Revocar refresh token (logout)
   */
  async revokeRefreshToken(refreshTokenString) {
    try {
      const refreshTokenRecord = await prisma.refreshToken.findFirst({
        where: {
          token: refreshTokenString,
          isRevoked: false
        }
      });

      if (refreshTokenRecord) {
        await prisma.refreshToken.update({
          where: { id: refreshTokenRecord.id },
          data: { isRevoked: true }
        });
      }

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      console.error('❌ Error revocando refresh token:', error.message);
      throw new ValidationError('Error al cerrar sesión');
    }
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId) {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false
        },
        data: { isRevoked: true }
      });

      return { message: 'Todas las sesiones han sido cerradas' };
    } catch (error) {
      console.error('❌ Error revocando todos los tokens:', error.message);
      throw new ValidationError('Error al cerrar todas las sesiones');
    }
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  async forgotPassword(email) {
    try {
      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, firstName: true, email: true }
      });

      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return { message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.' };
      }

      // Generar token de restablecimiento
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Guardar token en base de datos
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt
        }
      });

      // Crear enlace de restablecimiento
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      // Enviar email
      await emailService.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        resetUrl,
        expiresIn: '15 minutos'
      });

      return { message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.' };
    } catch (error) {
      console.error('❌ Error en forgotPassword:', error.message);
      throw new ValidationError('Error al procesar solicitud de restablecimiento');
    }
  }

  /**
   * Verificar token de restablecimiento
   */
  async verifyResetToken(token) {
    try {
      // Hash del token para comparar con la base de datos
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar token válido
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          expiresAt: {
            gt: new Date()
          },
          usedAt: null
        }
      });

      if (!resetToken) {
        throw new AuthError('Token de restablecimiento inválido o expirado');
      }

      return { message: 'Token válido' };
    } catch (error) {
      console.error('❌ Error en verifyResetToken:', error.message);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new ValidationError('Error al verificar token');
    }
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(token, newPassword) {
    try {
      // Hash del token para comparar con la base de datos
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar token válido
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          expiresAt: {
            gt: new Date()
          },
          usedAt: null
        },
        include: {
          user: true
        }
      });

      if (!resetToken) {
        throw new AuthError('Token de restablecimiento inválido o expirado');
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Actualizar contraseña del usuario y marcar token como usado
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword }
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() }
        }),
        // Revocar todos los refresh tokens existentes por seguridad
        prisma.refreshToken.updateMany({
          where: {
            userId: resetToken.userId,
            isRevoked: false
          },
          data: { isRevoked: true }
        })
      ]);

      return { message: 'Contraseña restablecida exitosamente' };
    } catch (error) {
      console.error('❌ Error en resetPassword:', error.message);
      if (error instanceof AuthError) {
        throw error;
      }
      throw new ValidationError('Error al restablecer contraseña');
    }
  }

  /**
   * Habilitar 2FA para un usuario (Admin)
   */
  async enable2FAAdmin(userId) {
    try {
      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true, is2FAEnabled: true }
      });

      if (!user) {
        throw new NotFoundError('Usuario no encontrado');
      }

      if (user.is2FAEnabled) {
        throw new ValidationError('El usuario ya tiene 2FA habilitado');
      }

      // Habilitar 2FA
      await prisma.user.update({
        where: { id: userId },
        data: { is2FAEnabled: true }
      });

      return { message: `2FA habilitado para ${user.firstName} ${user.lastName}` };
    } catch (error) {
      console.error('❌ Error en enable2FAAdmin:', error.message);
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Error al habilitar 2FA');
    }
  }

  /**
   * Deshabilitar 2FA para un usuario (Admin)
   */
  async disable2FAAdmin(userId) {
    try {
      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true, is2FAEnabled: true }
      });

      if (!user) {
        throw new NotFoundError('Usuario no encontrado');
      }

      if (!user.is2FAEnabled) {
        throw new ValidationError('El usuario no tiene 2FA habilitado');
      }

      // Deshabilitar 2FA y limpiar datos relacionados
      await prisma.user.update({
        where: { id: userId },
        data: { 
          is2FAEnabled: false,
          otpSecret: null,
          otpCode: null,
          otpExpiry: null
        }
      });

      return { message: `2FA deshabilitado para ${user.firstName} ${user.lastName}` };
    } catch (error) {
      console.error('❌ Error en disable2FAAdmin:', error.message);
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Error al deshabilitar 2FA');
    }
  }
}

module.exports = new AuthService();