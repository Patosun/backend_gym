const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const userService = {
  /**
   * Obtener todos los usuarios con filtros y paginación
   */
  async getAllUsers(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const whereClause = { ...filters };
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          photo: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Obtener usuario por ID
   */
  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /**
   * Obtener usuario por email con contraseña (para autenticación)
   */
  async getUserByEmailWithPassword(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true,
        trainer: true,
        member: true
      }
    });
  },

  /**
   * Actualizar usuario
   */
  async updateUser(id, data) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          photo: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Usuario no encontrado');
      }
      throw error;
    }
  },

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Verificar usuario existe y contraseña actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    return true;
  },

  /**
   * Actualizar último login
   */
  async updateLastLogin(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    });
  },

  /**
   * Verificar email del usuario
   */
  async verifyEmail(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: { 
        emailVerified: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    });
  },

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, active, inactive, roleStats, recentRegistrations] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      })
    ]);

    // Formatear estadísticas por rol
    const byRole = {
      ADMIN: 0,
      EMPLOYEE: 0,
      TRAINER: 0,
      MEMBER: 0
    };

    roleStats.forEach(stat => {
      byRole[stat.role] = stat._count.role;
    });

    return {
      total,
      active,
      inactive,
      byRole,
      recentRegistrations
    };
  },

  /**
   * Buscar usuarios por término
   */
  async searchUsers(searchTerm, limit = 10) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        photo: true
      },
      take: limit,
      orderBy: { firstName: 'asc' }
    });
  },

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(role, isActive = true) {
    return await prisma.user.findMany({
      where: { 
        role,
        isActive
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });
  },

  /**
   * Contar usuarios por sucursal (empleados y entrenadores)
   */
  async getUsersByBranch(branchId) {
    const [employees, trainers] = await Promise.all([
      prisma.employee.findMany({
        where: { branchId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              photo: true
            }
          }
        }
      }),
      prisma.trainer.findMany({
        where: { branchId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              photo: true
            }
          }
        }
      })
    ]);

    return {
      employees: employees.map(emp => ({ ...emp.user, position: emp.position, hireDate: emp.hireDate })),
      trainers: trainers.map(trainer => ({ ...trainer.user, specialties: trainer.specialties, experience: trainer.experience }))
    };
  },

  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(id) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Usuario no encontrado');
      }
      throw error;
    }
  }
};

module.exports = userService;