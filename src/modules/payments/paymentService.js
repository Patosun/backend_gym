const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const paymentService = {
  /**
   * Obtener todos los pagos con filtros y paginación
   */
  async getAllPayments(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    
    if (filters.status) whereClause.status = filters.status;
    if (filters.method) whereClause.method = filters.method;
    if (filters.memberId) whereClause.memberId = filters.memberId;
    if (filters.branchId) whereClause.branchId = filters.branchId;

    // Filtro por fechas
    if (filters.startDate || filters.endDate) {
      whereClause.paymentDate = {};
      if (filters.startDate) whereClause.paymentDate.gte = filters.startDate;
      if (filters.endDate) whereClause.paymentDate.lte = filters.endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
                  phone: true
                }
              }
            }
          },
          membership: {
            include: {
              membershipType: {
                select: {
                  name: true
                }
              }
            }
          },
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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where: whereClause })
    ]);

    // Calcular resumen
    const summary = await this.calculatePaymentSummary(whereClause);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary
    };
  },

  /**
   * Crear nuevo pago
   */
  async createPayment(data) {
    try {
      console.log('Creating payment with data:', JSON.stringify(data, null, 2));
      
      // Verificar que el miembro existe
      const member = await prisma.member.findUnique({
        where: { id: data.memberId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!member) {
        throw new Error('Miembro no encontrado');
      }

      // Verificar que la sucursal existe
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId }
      });

      if (!branch) {
        throw new Error('Sucursal no encontrada');
      }

      // Si se especifica membershipId, verificar que existe
      if (data.membershipId) {
        const membership = await prisma.membership.findUnique({
          where: { id: data.membershipId }
        });

        if (!membership) {
          throw new Error('Membresía no encontrada');
        }

        if (membership.memberId !== data.memberId) {
          throw new Error('La membresía no pertenece al miembro especificado');
        }
      }

      console.log('All validations passed, creating payment...');
      
      const payment = await prisma.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          status: data.status || 'PENDING',
          description: data.description,
          notes: data.notes,
          paymentDate: data.status === 'COMPLETED' ? (data.paymentDate || new Date()) : new Date(),
          dueDate: data.dueDate,
          member: {
            connect: { id: data.memberId }
          },
          branch: {
            connect: { id: data.branchId }
          },
          ...(data.membershipId && {
            membership: {
              connect: { id: data.membershipId }
            }
          })
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
          membership: {
            include: {
              membershipType: true
            }
          },
          branch: {
            select: {
              name: true,
              address: true
            }
          }
        }
      });

      console.log('Payment created successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('Error in createPayment:', error);
      throw error;
    }
  },

  /**
   * Obtener pago por ID
   */
  async getPaymentById(id) {
    return await prisma.payment.findUnique({
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
        membership: {
          include: {
            membershipType: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });
  },

  /**
   * Actualizar pago
   */
  async updatePayment(id, data) {
    try {
      return await prisma.payment.update({
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
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          membership: {
            include: {
              membershipType: true
            }
          },
          branch: {
            select: {
              name: true
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Pago no encontrado');
      }
      throw error;
    }
  },

  /**
   * Confirmar pago pendiente
   */
  async confirmPayment(id, reference = null, notes = null) {
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('Solo se pueden confirmar pagos pendientes');
    }

    return await prisma.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
        reference: reference || payment.reference,
        notes: notes || payment.notes,
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
        }
      }
    });
  },

  /**
   * Cancelar pago
   */
  async cancelPayment(id, reason = null) {
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    if (payment.status === 'COMPLETED') {
      throw new Error('No se pueden cancelar pagos completados');
    }

    return await prisma.payment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${payment.notes || ''}\nCancelado: ${reason}`.trim() : payment.notes,
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
        }
      }
    });
  },

  /**
   * Obtener pagos por miembro
   */
  async getPaymentsByMember(memberId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { memberId },
        include: {
          membership: {
            include: {
              membershipType: {
                select: {
                  name: true,
                  durationDays: true
                }
              }
            }
          },
          branch: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where: { memberId } })
    ]);

    // Estadísticas del miembro
    const memberStats = await this.getMemberPaymentStats(memberId);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      memberStats
    };
  },

  /**
   * Obtener estadísticas de pagos
   */
  async getPaymentStats(filters = {}) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Construir filtro base
    let baseFilter = {};
    if (filters.startDate) {
      baseFilter.paymentDate = { ...baseFilter.paymentDate, gte: filters.startDate };
    }
    if (filters.endDate) {
      baseFilter.paymentDate = { ...baseFilter.paymentDate, lte: filters.endDate };
    }
    if (filters.branchId) {
      baseFilter.branchId = filters.branchId;
    }

    const [
      totalStats,
      completedStats,
      pendingStats,
      cancelledStats,
      methodStats,
      branchStats,
      dailyRevenue
    ] = await Promise.all([
      // Estadísticas totales
      prisma.payment.aggregate({
        where: baseFilter,
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Pagos completados
      prisma.payment.aggregate({
        where: { ...baseFilter, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Pagos pendientes
      prisma.payment.aggregate({
        where: { ...baseFilter, status: 'PENDING' },
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Pagos cancelados
      prisma.payment.aggregate({
        where: { ...baseFilter, status: 'CANCELLED' },
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Por método de pago
      prisma.payment.groupBy({
        by: ['method', 'status'],
        where: baseFilter,
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Por sucursal
      prisma.payment.groupBy({
        by: ['branchId'],
        where: { ...baseFilter, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Ingresos diarios (últimos 30 días)
      this.getDailyRevenue(30, baseFilter)
    ]);

    // Procesar estadísticas por método
    const byMethod = {
      CASH: { count: 0, amount: 0, completed: 0, pending: 0 },
      QR: { count: 0, amount: 0, completed: 0, pending: 0 }
    };

    methodStats.forEach(stat => {
      byMethod[stat.method].count += stat._count.id;
      byMethod[stat.method].amount += stat._sum.amount || 0;
      byMethod[stat.method][stat.status.toLowerCase()] += stat._count.id;
    });

    // Obtener nombres de sucursales
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true }
    });

    const byBranch = {};
    branchStats.forEach(stat => {
      const branch = branches.find(b => b.id === stat.branchId);
      if (branch) {
        byBranch[branch.name] = {
          count: stat._count.id,
          amount: stat._sum.amount || 0
        };
      }
    });

    return {
      total: {
        count: totalStats._count.id,
        amount: totalStats._sum.amount || 0
      },
      completed: {
        count: completedStats._count.id,
        amount: completedStats._sum.amount || 0
      },
      pending: {
        count: pendingStats._count.id,
        amount: pendingStats._sum.amount || 0
      },
      cancelled: {
        count: cancelledStats._count.id,
        amount: cancelledStats._sum.amount || 0
      },
      byMethod,
      byBranch,
      dailyRevenue
    };
  },

  /**
   * Obtener pagos pendientes
   */
  async getPendingPayments(filters = {}) {
    let whereClause = { status: 'PENDING' };

    if (filters.branchId) {
      whereClause.branchId = filters.branchId;
    }

    if (filters.overdue) {
      whereClause.dueDate = { lt: new Date() };
    }

    return await prisma.payment.findMany({
      where: whereClause,
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
        membership: {
          include: {
            membershipType: {
              select: {
                name: true
              }
            }
          }
        },
        branch: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  },

  /**
   * Obtener miembro por userId (para verificación de permisos)
   */
  async getMemberByUserId(userId) {
    return await prisma.member.findUnique({
      where: { userId }
    });
  },

  /**
   * Calcular resumen de pagos
   */
  async calculatePaymentSummary(whereClause) {
    const [totalAmount, completedAmount, pendingAmount] = await Promise.all([
      prisma.payment.aggregate({
        where: whereClause,
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...whereClause, status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...whereClause, status: 'PENDING' },
        _sum: { amount: true }
      })
    ]);

    return {
      totalAmount: totalAmount._sum.amount || 0,
      completedAmount: completedAmount._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0
    };
  },

  /**
   * Obtener estadísticas de pagos de un miembro específico
   */
  async getMemberPaymentStats(memberId) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalPaid, thisYearPaid, lastPayment, pendingCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { memberId, status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          memberId, 
          status: 'COMPLETED',
          paymentDate: { gte: startOfYear }
        },
        _sum: { amount: true }
      }),
      prisma.payment.findFirst({
        where: { memberId, status: 'COMPLETED' },
        orderBy: { paymentDate: 'desc' },
        select: { paymentDate: true, amount: true }
      }),
      prisma.payment.count({
        where: { memberId, status: 'PENDING' }
      })
    ]);

    return {
      totalPaid: totalPaid._sum.amount || 0,
      thisYearPaid: thisYearPaid._sum.amount || 0,
      lastPayment,
      pendingCount
    };
  },

  /**
   * Obtener ingresos diarios
   */
  async getDailyRevenue(days = 30, baseFilter = {}) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const payments = await prisma.payment.findMany({
      where: {
        ...baseFilter,
        status: 'COMPLETED',
        paymentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        paymentDate: true
      }
    });

    // Agrupar por día
    const dailyData = {};
    payments.forEach(payment => {
      const date = payment.paymentDate.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date] += parseFloat(payment.amount);
    });

    // Convertir a array ordenado
    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
  }
};

module.exports = paymentService;