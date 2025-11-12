const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const membershipService = {
  // ===================
  // MEMBERSHIP TYPES
  // ===================

  /**
   * Obtener todos los tipos de membresía
   */
  async getAllMembershipTypes(filters = {}) {
    const whereClause = { ...filters };

    return await prisma.membershipType.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Crear nuevo tipo de membresía
   */
  async createMembershipType(data) {
    // Verificar que no existe un tipo con el mismo nombre
    const existing = await prisma.membershipType.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      throw new Error('Ya existe un tipo de membresía con este nombre');
    }

    return await prisma.membershipType.create({
      data
    });
  },

  /**
   * Obtener tipo de membresía por ID
   */
  async getMembershipTypeById(id) {
    return await prisma.membershipType.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          take: 5,
          include: {
            member: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  },

  /**
   * Actualizar tipo de membresía
   */
  async updateMembershipType(id, data) {
    try {
      return await prisma.membershipType.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Tipo de membresía no encontrado');
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new Error('Ya existe un tipo de membresía con este nombre');
      }
      throw error;
    }
  },

  // ===================
  // MEMBERSHIPS
  // ===================

  /**
   * Obtener todas las membresías con filtros y paginación
   */
  async getAllMemberships(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Búsqueda por texto
    if (filters.search) {
      whereClause.OR = [
        {
          member: {
            membershipNumber: { contains: filters.search, mode: 'insensitive' }
          }
        },
        {
          member: {
            user: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          membershipType: {
            name: { contains: filters.search, mode: 'insensitive' }
          }
        }
      ];
    }

    const [memberships, total] = await Promise.all([
      prisma.membership.findMany({
        where: whereClause,
        include: {
          member: {
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
          },
          membershipType: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.membership.count({ where: whereClause })
    ]);

    return {
      memberships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Crear nueva membresía
   */
  async createMembership(data) {
    // Verificar que el miembro existe
    const member = await prisma.member.findUnique({
      where: { id: data.memberId }
    });

    if (!member) {
      throw new Error('Miembro no encontrado');
    }

    // Verificar que el tipo de membresía existe y está activo
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: data.membershipTypeId }
    });

    if (!membershipType) {
      throw new Error('Tipo de membresía no encontrado');
    }

    if (!membershipType.isActive) {
      throw new Error('El tipo de membresía no está activo');
    }

    // Verificar si el miembro ya tiene una membresía activa
    const activeMembership = await prisma.membership.findFirst({
      where: {
        memberId: data.memberId,
        status: 'ACTIVE'
      }
    });

    if (activeMembership) {
      throw new Error('El miembro ya tiene una membresía activa');
    }

    // Calcular fecha de finalización
    const startDate = data.startDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + membershipType.durationDays);

    const membership = await prisma.membership.create({
      data: {
        ...data,
        startDate,
        endDate,
        status: 'ACTIVE'
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        membershipType: true
      }
    });

    return membership;
  },

  /**
   * Obtener membresía por ID
   */
  async getMembershipById(id) {
    return await prisma.membership.findUnique({
      where: { id },
      include: {
        member: {
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
        },
        membershipType: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  },

  /**
   * Actualizar membresía
   */
  async updateMembership(id, data) {
    try {
      return await prisma.membership.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          member: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          membershipType: true
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Membresía no encontrada');
      }
      throw error;
    }
  },

  /**
   * Extender membresía
   */
  async extendMembership(id, days, notes = null) {
    try {
      const membership = await prisma.membership.findUnique({
        where: { id }
      });

      if (!membership) {
        throw new Error('Membresía no encontrada');
      }

      const currentEndDate = new Date(membership.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const updatedMembership = await prisma.membership.update({
        where: { id },
        data: {
          endDate: newEndDate,
          notes: notes || membership.notes,
          updatedAt: new Date()
        },
        include: {
          member: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          membershipType: true
        }
      });

      return updatedMembership;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Membresía no encontrada');
      }
      throw error;
    }
  },

  /**
   * Obtener membresías próximas a expirar
   */
  async getExpiringMemberships(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        membershipType: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: { endDate: 'asc' }
    });
  },

  /**
   * Obtener estadísticas de membresías
   */
  async getMembershipStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const [
      total,
      active,
      expired,
      expiringSoon,
      typeStats,
      monthlyRevenue
    ] = await Promise.all([
      prisma.membership.count(),
      prisma.membership.count({ where: { status: 'ACTIVE' } }),
      prisma.membership.count({ where: { status: 'EXPIRED' } }),
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: { lte: futureDate, gte: now }
        }
      }),
      prisma.membership.groupBy({
        by: ['membershipTypeId'],
        where: { status: 'ACTIVE' },
        _count: { membershipTypeId: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paymentDate: { gte: startOfMonth }
        },
        _sum: { amount: true }
      })
    ]);

    // Obtener nombres de tipos para estadísticas
    const membershipTypes = await prisma.membershipType.findMany({
      select: { id: true, name: true }
    });

    const byType = {};
    typeStats.forEach(stat => {
      const type = membershipTypes.find(t => t.id === stat.membershipTypeId);
      if (type) {
        byType[type.name] = stat._count.membershipTypeId;
      }
    });

    return {
      total,
      active,
      expired,
      expiringSoon,
      byType,
      revenue: {
        thisMonth: monthlyRevenue._sum.amount || 0
      }
    };
  },

  /**
   * Actualizar membresías expiradas (tarea programada)
   */
  async updateExpiredMemberships() {
    const now = new Date();
    
    const result = await prisma.membership.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now }
      },
      data: {
        status: 'EXPIRED',
        updatedAt: now
      }
    });

    return result.count;
  },

  /**
   * Obtener membresías por miembro
   */
  async getMembershipsByMember(memberId) {
    return await prisma.membership.findMany({
      where: { memberId },
      include: {
        membershipType: true,
        payments: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            amount: true,
            paymentDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};

module.exports = membershipService;