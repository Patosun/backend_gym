const prisma = require('../../config/prisma');

class ReportService {
  /**
   * Reporte de membresías
   */
  async getMembershipReport(filters = {}) {
    const { startDate, endDate, branchId, membershipTypeId } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Construir where clause para membresías
    const membershipWhere = {};
    if (startDate || endDate) membershipWhere.createdAt = dateFilter;
    if (membershipTypeId) membershipWhere.membershipTypeId = membershipTypeId;

    const [
      totalMemberships,
      activeMemberships,
      newMemberships,
      expiringMemberships,
      membershipsByType,
      monthlyTrend
    ] = await Promise.all([
      // Total membresías
      prisma.membership.count({ where: membershipWhere }),
      
      // Membresías activas
      prisma.membership.count({
        where: { 
          ...membershipWhere,
          status: 'ACTIVE',
          endDate: { gte: new Date() }
        }
      }),
      
      // Nuevas membresías en el período
      prisma.membership.count({
        where: {
          ...membershipWhere,
          createdAt: dateFilter
        }
      }),
      
      // Membresías que expiran en los próximos 30 días
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Distribución por tipo de membresía
      prisma.membership.groupBy({
        by: ['membershipTypeId'],
        where: membershipWhere,
        _count: { id: true }
      }).then(async (groups) => {
        const typesData = await Promise.all(
          groups.map(async (group) => {
            const type = await prisma.membershipType.findUnique({
              where: { id: group.membershipTypeId },
              select: { name: true, price: true }
            });
            return {
              type: type?.name || 'Desconocido',
              count: group._count.id,
              price: type?.price || 0
            };
          })
        );
        return typesData;
      }),
      
      // Tendencia mensual de nuevas membresías
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM memberships
        WHERE "createdAt" >= ${startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `
    ]);

    return {
      summary: {
        total: totalMemberships,
        active: activeMemberships,
        new: newMemberships,
        expiring: expiringMemberships
      },
      byType: membershipsByType,
      monthlyTrend
    };
  }

  /**
   * Reporte de asistencia
   */
  async getAttendanceReport(filters = {}) {
    const { startDate, endDate, branchId } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const checkInWhere = {};
    if (startDate || endDate) checkInWhere.checkInAt = dateFilter;
    if (branchId) checkInWhere.branchId = branchId;

    const [
      totalCheckIns,
      uniqueMembers,
      averageVisitsPerMember,
      peakHours,
      dailyTrend,
      membershipUsage,
      branchDistribution
    ] = await Promise.all([
      // Total check-ins
      prisma.checkIn.count({ where: checkInWhere }),
      
      // Miembros únicos
      prisma.checkIn.findMany({
        where: checkInWhere,
        select: { memberId: true },
        distinct: ['memberId']
      }).then(result => result.length),
      
      // Promedio de visitas por miembro
      prisma.checkIn.groupBy({
        by: ['memberId'],
        where: checkInWhere,
        _count: { id: true }
      }).then(groups => {
        if (groups.length === 0) return 0;
        const total = groups.reduce((sum, group) => sum + group._count.id, 0);
        return Math.round((total / groups.length) * 100) / 100;
      }),
      
      // Horas pico
      prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "checkInAt") as hour,
          COUNT(*) as count
        FROM check_ins
        WHERE ${startDate ? prisma.$queryRaw`"checkInAt" >= ${new Date(startDate)}` : prisma.$queryRaw`TRUE`}
          ${endDate ? prisma.$queryRaw`AND "checkInAt" <= ${new Date(endDate)}` : prisma.$queryRaw``}
          ${branchId ? prisma.$queryRaw`AND "branchId" = ${branchId}` : prisma.$queryRaw``}
        GROUP BY EXTRACT(HOUR FROM "checkInAt")
        ORDER BY count DESC
        LIMIT 5
      `,
      
      // Tendencia diaria
      prisma.$queryRaw`
        SELECT 
          DATE("checkInAt") as date,
          COUNT(*) as count
        FROM check_ins
        WHERE ${startDate ? prisma.$queryRaw`"checkInAt" >= ${new Date(startDate)}` : prisma.$queryRaw`TRUE`}
          ${endDate ? prisma.$queryRaw`AND "checkInAt" <= ${new Date(endDate)}` : prisma.$queryRaw``}
          ${branchId ? prisma.$queryRaw`AND "branchId" = ${branchId}` : prisma.$queryRaw``}
        GROUP BY DATE("checkInAt")
        ORDER BY date
      `,
      
      // Uso por tipo de membresía
      prisma.checkIn.findMany({
        where: checkInWhere,
        include: {
          member: {
            include: {
              memberships: {
                where: { status: 'ACTIVE' },
                include: { membershipType: true }
              }
            }
          }
        }
      }).then(checkIns => {
        const usage = {};
        checkIns.forEach(checkIn => {
          const activeMembership = checkIn.member.memberships[0];
          if (activeMembership) {
            const typeName = activeMembership.membershipType.name;
            usage[typeName] = (usage[typeName] || 0) + 1;
          }
        });
        return usage;
      }),
      
      // Distribución por sucursal
      branchId ? null : prisma.checkIn.groupBy({
        by: ['branchId'],
        where: checkInWhere,
        _count: { id: true }
      }).then(async (groups) => {
        const branchData = await Promise.all(
          groups.map(async (group) => {
            const branch = await prisma.branch.findUnique({
              where: { id: group.branchId },
              select: { name: true, city: true }
            });
            return {
              branch: branch?.name || 'Desconocida',
              city: branch?.city || '',
              count: group._count.id
            };
          })
        );
        return branchData;
      })
    ]);

    return {
      summary: {
        totalCheckIns,
        uniqueMembers,
        averageVisitsPerMember
      },
      peakHours,
      dailyTrend,
      membershipUsage,
      branchDistribution
    };
  }

  /**
   * Reporte de ingresos
   */
  async getRevenueReport(filters = {}) {
    const { startDate, endDate, branchId, paymentMethod } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const paymentWhere = { status: 'COMPLETED' };
    if (startDate || endDate) paymentWhere.paymentDate = dateFilter;
    if (branchId) paymentWhere.branchId = branchId;
    if (paymentMethod) paymentWhere.method = paymentMethod;

    const [
      totalRevenue,
      totalPayments,
      revenueByMethod,
      revenueByBranch,
      monthlyRevenue,
      membershipRevenue
    ] = await Promise.all([
      // Ingresos totales
      prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      
      // Total de pagos
      prisma.payment.count({ where: paymentWhere }),
      
      // Ingresos por método de pago
      prisma.payment.groupBy({
        by: ['method'],
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // Ingresos por sucursal
      branchId ? null : prisma.payment.groupBy({
        by: ['branchId'],
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true }
      }).then(async (groups) => {
        const branchData = await Promise.all(
          groups.map(async (group) => {
            const branch = await prisma.branch.findUnique({
              where: { id: group.branchId },
              select: { name: true, city: true }
            });
            return {
              branch: branch?.name || 'Desconocida',
              city: branch?.city || '',
              revenue: group._sum.amount || 0,
              payments: group._count.id
            };
          })
        );
        return branchData;
      }),
      
      // Tendencia mensual de ingresos
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "paymentDate") as month,
          SUM(amount) as revenue,
          COUNT(*) as payments
        FROM payments
        WHERE status = 'COMPLETED'
          ${startDate ? prisma.$queryRaw`AND "paymentDate" >= ${new Date(startDate)}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND "paymentDate" <= ${new Date(endDate)}` : prisma.$queryRaw``}
          ${branchId ? prisma.$queryRaw`AND "branchId" = ${branchId}` : prisma.$queryRaw``}
        GROUP BY DATE_TRUNC('month', "paymentDate")
        ORDER BY month
      `,
      
      // Ingresos por membresías vs otros
      prisma.payment.groupBy({
        by: ['membershipId'],
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true }
      }).then(groups => {
        const membershipPayments = groups.filter(g => g.membershipId !== null);
        const otherPayments = groups.filter(g => g.membershipId === null);
        
        const membershipRevenue = membershipPayments.reduce((sum, g) => sum + (g._sum.amount || 0), 0);
        const otherRevenue = otherPayments.reduce((sum, g) => sum + (g._sum.amount || 0), 0);
        
        return {
          membership: {
            revenue: membershipRevenue,
            count: membershipPayments.reduce((sum, g) => sum + g._count.id, 0)
          },
          other: {
            revenue: otherRevenue,
            count: otherPayments.reduce((sum, g) => sum + g._count.id, 0)
          }
        };
      })
    ]);

    return {
      summary: {
        totalRevenue: parseFloat(totalRevenue),
        totalPayments,
        averagePayment: totalPayments > 0 ? parseFloat(totalRevenue) / totalPayments : 0
      },
      byMethod: revenueByMethod,
      byBranch: revenueByBranch,
      monthlyTrend: monthlyRevenue,
      membershipRevenue
    };
  }

  /**
   * Dashboard general con métricas clave
   */
  async getDashboardStats(filters = {}) {
    const { branchId } = filters;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    const [
      todayCheckIns,
      weekCheckIns,
      monthCheckIns,
      activeMembers,
      expiringMemberships,
      todayRevenue,
      monthRevenue,
      activeMemberships
    ] = await Promise.all([
      // Check-ins de hoy
      prisma.checkIn.count({
        where: {
          ...(branchId && { branchId }),
          checkInAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Check-ins de la semana
      prisma.checkIn.count({
        where: {
          ...(branchId && { branchId }),
          checkInAt: { gte: startOfWeek }
        }
      }),
      
      // Check-ins del mes
      prisma.checkIn.count({
        where: {
          ...(branchId && { branchId }),
          checkInAt: { gte: startOfMonth }
        }
      }),
      
      // Miembros con check-ins activos
      prisma.checkIn.findMany({
        where: {
          ...(branchId && { branchId }),
          checkOutAt: null
        },
        select: { memberId: true },
        distinct: ['memberId']
      }).then(result => result.length),
      
      // Membresías que expiran en 30 días
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Ingresos de hoy
      prisma.payment.aggregate({
        where: {
          ...(branchId && { branchId }),
          status: 'COMPLETED',
          paymentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      
      // Ingresos del mes
      prisma.payment.aggregate({
        where: {
          ...(branchId && { branchId }),
          status: 'COMPLETED',
          paymentDate: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      
      // Total membresías activas
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: { gte: new Date() }
        }
      })
    ]);

    return {
      checkIns: {
        today: todayCheckIns,
        week: weekCheckIns,
        month: monthCheckIns,
        active: activeMembers
      },
      memberships: {
        active: activeMemberships,
        expiring: expiringMemberships
      },
      revenue: {
        today: parseFloat(todayRevenue),
        month: parseFloat(monthRevenue)
      }
    };
  }
}

module.exports = new ReportService();