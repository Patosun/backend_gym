const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const memberService = {
  /**
   * Obtener todos los miembros con filtros y paginación
   */
  async getAllMembers(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Búsqueda por texto
    if (filters.search) {
      whereClause.OR = [
        { membershipNumber: { contains: filters.search, mode: 'insensitive' } },
        { 
          user: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              photo: true,
              isActive: true
            }
          },
          memberships: {
            where: { status: 'ACTIVE' },
            include: {
              membershipType: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.member.count({ where: whereClause })
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Crear nuevo miembro
   */
  async createMember(data) {
    // Verificar que el usuario existe y tiene rol MEMBER
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.role !== 'MEMBER') {
      throw new Error('El usuario debe tener rol MEMBER');
    }

    // Verificar que no existe un miembro con este userId
    const existingMember = await prisma.member.findUnique({
      where: { userId: data.userId }
    });

    if (existingMember) {
      throw new Error('Ya existe un miembro asociado a este usuario');
    }

    // Generar número de membresía único
    const membershipNumber = await this.generateMembershipNumber();
    
    // Generar QR inicial
    const qrCode = uuidv4();
    const qrCodeExpiry = new Date();
    qrCodeExpiry.setHours(qrCodeExpiry.getHours() + 24); // Expira en 24 horas

    const member = await prisma.member.create({
      data: {
        ...data,
        membershipNumber,
        qrCode,
        qrCodeExpiry,
        isActive: true,
        joinDate: data.joinDate || new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            photo: true,
            isActive: true
          }
        }
      }
    });

    return member;
  },

  /**
   * Obtener miembro por ID
   */
  async getMemberById(id) {
    return await prisma.member.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            photo: true,
            isActive: true
          }
        },
        memberships: {
          include: {
            membershipType: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  /**
   * Obtener miembro por userId
   */
  async getMemberByUserId(userId) {
    return await prisma.member.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            photo: true,
            isActive: true
          }
        },
        memberships: {
          include: {
            membershipType: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  /**
   * Obtener miembro por código QR
   */
  async getMemberByQR(qrCode) {
    const member = await prisma.member.findUnique({
      where: { qrCode },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            photo: true,
            isActive: true
          }
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            membershipType: true
          }
        }
      }
    });

    // Verificar si el QR no ha expirado
    if (member && member.qrCodeExpiry < new Date()) {
      return null; // QR expirado
    }

    return member;
  },

  /**
   * Actualizar miembro
   */
  async updateMember(id, data) {
    try {
      const member = await prisma.member.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              photo: true,
              isActive: true
            }
          },
          memberships: {
            include: {
              membershipType: true
            },
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      });

      return member;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Miembro no encontrado');
      }
      throw error;
    }
  },

  /**
   * Regenerar código QR
   */
  async regenerateQR(memberId) {
    const qrCode = uuidv4();
    const qrCodeExpiry = new Date();
    qrCodeExpiry.setHours(qrCodeExpiry.getHours() + 24);

    try {
      const member = await prisma.member.update({
        where: { id: memberId },
        data: {
          qrCode,
          qrCodeExpiry,
          updatedAt: new Date()
        }
      });

      return {
        qrCode: member.qrCode,
        qrCodeExpiry: member.qrCodeExpiry
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Miembro no encontrado');
      }
      throw error;
    }
  },

  /**
   * Obtener estado de membresía
   */
  async getMembershipStatus(memberId) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          include: {
            membershipType: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!member) {
      throw new Error('Miembro no encontrado');
    }

    const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');
    
    if (activeMembership) {
      const now = new Date();
      const endDate = new Date(activeMembership.endDate);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      return {
        hasActiveMembership: true,
        currentMembership: activeMembership,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining <= 0
      };
    }

    return {
      hasActiveMembership: false,
      currentMembership: null,
      daysRemaining: 0,
      isExpired: true
    };
  },

  /**
   * Obtener historial de check-ins del miembro
   */
  async getMemberCheckins(memberId, filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    let whereClause = { memberId };

    if (filters.startDate || filters.endDate) {
      whereClause.checkInAt = {};
      if (filters.startDate) whereClause.checkInAt.gte = filters.startDate;
      if (filters.endDate) whereClause.checkInAt.lte = filters.endDate;
    }

    const [checkins, total] = await Promise.all([
      prisma.checkIn.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' }
      }),
      prisma.checkIn.count({ where: whereClause })
    ]);

    // Estadísticas adicionales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [totalCheckins, thisMonthCheckins] = await Promise.all([
      prisma.checkIn.count({ where: { memberId } }),
      prisma.checkIn.count({ 
        where: { 
          memberId, 
          checkInAt: { gte: startOfMonth } 
        } 
      })
    ]);

    // Promedio semanal (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const last30DaysCheckins = await prisma.checkIn.count({
      where: {
        memberId,
        checkInAt: { gte: thirtyDaysAgo }
      }
    });

    const averagePerWeek = (last30DaysCheckins / 4.3).toFixed(1);

    return {
      checkins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalCheckins,
        thisMonth: thisMonthCheckins,
        averagePerWeek: parseFloat(averagePerWeek)
      }
    };
  },

  /**
   * Obtener estadísticas generales de miembros
   */
  async getMemberStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, active, inactive, withActiveMembership, newThisMonth] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { isActive: true } }),
      prisma.member.count({ where: { isActive: false } }),
      prisma.member.count({
        where: {
          memberships: {
            some: { status: 'ACTIVE' }
          }
        }
      }),
      prisma.member.count({
        where: { createdAt: { gte: startOfMonth } }
      })
    ]);

    // Calcular edad promedio
    const membersWithAge = await prisma.member.findMany({
      where: {
        dateOfBirth: { not: null },
        isActive: true
      },
      select: { dateOfBirth: true }
    });

    let averageAge = 0;
    if (membersWithAge.length > 0) {
      const totalAge = membersWithAge.reduce((sum, member) => {
        const age = now.getFullYear() - member.dateOfBirth.getFullYear();
        return sum + age;
      }, 0);
      averageAge = Math.round(totalAge / membersWithAge.length);
    }

    return {
      total,
      active,
      inactive,
      withActiveMembership,
      newThisMonth,
      averageAge
    };
  },

  /**
   * Generar número de membresía único
   */
  async generateMembershipNumber() {
    const year = new Date().getFullYear().toString().slice(-2);
    let number;
    let exists = true;

    while (exists) {
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      number = `GM${year}${randomNum}`;
      
      const existing = await prisma.member.findUnique({
        where: { membershipNumber: number }
      });
      
      exists = !!existing;
    }

    return number;
  },

  /**
   * Buscar miembros por término
   */
  async searchMembers(searchTerm, limit = 10) {
    return await prisma.member.findMany({
      where: {
        OR: [
          { membershipNumber: { contains: searchTerm, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }
        ],
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photo: true
          }
        }
      },
      take: limit,
      orderBy: { user: { firstName: 'asc' } }
    });
  }
};

module.exports = memberService;