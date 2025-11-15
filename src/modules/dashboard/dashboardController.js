const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  try {
    const { user } = req;

    // Estadísticas base para todos los roles
    const baseStats = {
      userId: user.id,
      role: user.role,
      userName: `${user.firstName} ${user.lastName}`,
      email: user.email
    };

    // Estadísticas específicas según el rol
    switch (user.role) {
      case 'ADMIN':
      case 'EMPLOYEE':
        return await getAdminStats(res, baseStats);
      
      case 'TRAINER':
        return await getTrainerStats(res, baseStats, user.id);
      
      case 'MEMBER':
        return await getMemberStats(res, baseStats, user.id);
      
      default:
        return res.status(400).json({ error: 'Rol no válido' });
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getAdminStats = async (res, baseStats) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Contar usuarios totales por rol
    const [totalUsers, totalMembers, totalTrainers, totalEmployees] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'TRAINER' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } })
    ]);

    // Clases de hoy
    const classesToday = await prisma.class.count({
      where: {
        startTime: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Check-ins de hoy
    const checkInsToday = await prisma.checkIn.count({
      where: {
        checkInAt: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Ingresos del mes actual
    const currentMonthPayments = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    // Ingresos del mes pasado
    const lastMonthPayments = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    // Calcular porcentaje de crecimiento
    const currentMonthIncome = currentMonthPayments._sum.amount || 0;
    const lastMonthIncome = lastMonthPayments._sum.amount || 0;
    const incomeGrowthPercentage = lastMonthIncome > 0 
      ? Math.round(((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
      : 0;

    // Membresías activas
    const activeMemberships = await prisma.membership.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // Membresías que expiran en los próximos 7 días
    const expiringMemberships = await prisma.membership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const stats = {
      ...baseStats,
      totalUsers,
      totalMembers,
      totalTrainers,
      totalEmployees,
      classesToday,
      checkInsToday,
      currentMonthIncome,
      incomeGrowthPercentage,
      activeMemberships,
      expiringMemberships
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas de administrador' });
  }
};

const getTrainerStats = async (res, baseStats, userId) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Clases del entrenador hoy
    const myClassesToday = await prisma.class.count({
      where: {
        trainerId: userId,
        startTime: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Total de clases del entrenador este mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const myClassesThisMonth = await prisma.class.count({
      where: {
        trainerId: userId,
        startTime: {
          gte: startOfMonth
        }
      }
    });

    // Miembros únicos en las clases del entrenador
    const myMembersCount = await prisma.reservation.findMany({
      where: {
        class: {
          trainerId: userId
        }
      },
      select: {
        memberId: true
      },
      distinct: ['memberId']
    });

    // Próximas clases (las siguientes 5)
    const upcomingClasses = await prisma.class.findMany({
      where: {
        trainerId: userId,
        startTime: {
          gte: now
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5,
      include: {
        branch: {
          select: {
            name: true
          }
        }
      }
    });

    const stats = {
      ...baseStats,
      myClassesToday,
      myClassesThisMonth,
      myMembersCount: myMembersCount.length,
      upcomingClasses
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Error in getTrainerStats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas del entrenador' });
  }
};

const getMemberStats = async (res, baseStats, userId) => {
  try {
    const now = new Date();

    // Buscar el miembro asociado al usuario
    const member = await prisma.member.findFirst({
      where: { userId },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            membershipType: true
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Perfil de miembro no encontrado' });
    }

    // Membresía activa
    const activeMembership = member.memberships[0] || null;

    // Clases reservadas para hoy
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const classesToday = await prisma.reservation.count({
      where: {
        memberId: member.id,
        class: {
          startTime: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      }
    });

    // Total de clases este mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const classesThisMonth = await prisma.reservation.count({
      where: {
        memberId: member.id,
        class: {
          startTime: {
            gte: startOfMonth
          }
        }
      }
    });

    // Check-ins este mes
    const checkInsThisMonth = await prisma.checkIn.count({
      where: {
        memberId: member.id,
        checkInAt: {
          gte: startOfMonth
        }
      }
    });

    // Próximas clases reservadas
    const upcomingBookings = await prisma.reservation.findMany({
      where: {
        memberId: member.id,
        class: {
          startTime: {
            gte: now
          }
        }
      },
      include: {
        class: {
          include: {
            trainer: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            branch: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        class: {
          startTime: 'asc'
        }
      },
      take: 5
    });

    // Días hasta que expire la membresía
    let daysUntilExpiry = null;
    if (activeMembership) {
      const expiryDate = new Date(activeMembership.endDate);
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const stats = {
      ...baseStats,
      membershipNumber: member.membershipNumber,
      activeMembership: activeMembership ? {
        type: activeMembership.membershipType.name,
        endDate: activeMembership.endDate,
        daysUntilExpiry
      } : null,
      classesToday,
      classesThisMonth,
      checkInsThisMonth,
      upcomingBookings
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Error in getMemberStats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas del miembro' });
  }
};

module.exports = {
  getDashboardStats
};