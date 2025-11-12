const prisma = require('../../config/prisma');

class BranchService {
  /**
   * Crear nueva sucursal
   */
  async createBranch(branchData, createdById) {
    const branch = await prisma.branch.create({
      data: {
        ...branchData,
        createdById
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return branch;
  }

  /**
   * Obtener todas las sucursales
   */
  async getAllBranches(filters = {}) {
    const { page = 1, limit = 10, isActive, city, state } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              employees: true,
              trainers: true,
              checkIns: true
            }
          }
        }
      }),
      prisma.branch.count({ where })
    ]);

    return {
      branches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener sucursal por ID
   */
  async getBranchById(id) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        employees: {
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
        trainers: {
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
        _count: {
          select: {
            checkIns: true,
            classes: true,
            payments: true
          }
        }
      }
    });

    if (!branch) {
      throw new Error('Sucursal no encontrada');
    }

    return branch;
  }

  /**
   * Actualizar sucursal
   */
  async updateBranch(id, updateData) {
    const branch = await prisma.branch.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return branch;
  }

  /**
   * Eliminar sucursal (soft delete)
   */
  async deleteBranch(id) {
    const branch = await prisma.branch.update({
      where: { id },
      data: { isActive: false }
    });

    return branch;
  }

  /**
   * Obtener estadísticas de la sucursal
   */
  async getBranchStats(id, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      totalEmployees,
      totalTrainers,
      totalCheckInsToday,
      totalCheckInsMonth,
      totalPaymentsMonth,
      recentCheckIns
    ] = await Promise.all([
      // Total empleados activos
      prisma.employee.count({
        where: { branchId: id, isActive: true }
      }),
      
      // Total entrenadores activos
      prisma.trainer.count({
        where: { branchId: id, isActive: true }
      }),
      
      // Check-ins de hoy
      prisma.checkIn.count({
        where: {
          branchId: id,
          checkInAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Check-ins del mes
      prisma.checkIn.count({
        where: {
          branchId: id,
          checkInAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          }
        }
      }),
      
      // Pagos del mes
      prisma.payment.aggregate({
        where: {
          branchId: id,
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
          },
          status: 'COMPLETED'
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Últimos check-ins
      prisma.checkIn.findMany({
        where: { branchId: id },
        orderBy: { checkInAt: 'desc' },
        take: 10,
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
      })
    ]);

    return {
      employees: totalEmployees,
      trainers: totalTrainers,
      checkInsToday: totalCheckInsToday,
      checkInsMonth: totalCheckInsMonth,
      paymentsMonth: {
        total: totalPaymentsMonth._sum.amount || 0,
        count: totalPaymentsMonth._count
      },
      recentCheckIns
    };
  }

  /**
   * Obtener sucursales cercanas (por ciudad/estado)
   */
  async getNearbyBranches(city, state) {
    const branches = await prisma.branch.findMany({
      where: {
        OR: [
          { city: { contains: city, mode: 'insensitive' } },
          { state: { contains: state, mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        openingTime: true,
        closingTime: true
      },
      orderBy: { name: 'asc' }
    });

    return branches;
  }
}

module.exports = new BranchService();