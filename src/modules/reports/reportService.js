const prisma = require('../../config/prisma');

class ReportService {
  /**
   * Reporte de membresías (versión simplificada)
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

    try {
      const [
        totalMemberships,
        activeMemberships,
        newMemberships,
        expiringMemberships,
        membershipsByType
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
        })
      ]);

      return {
        summary: {
          total: totalMemberships,
          active: activeMemberships,
          new: newMemberships,
          expiring: expiringMemberships
        },
        byType: membershipsByType.map(group => ({
          membershipTypeId: group.membershipTypeId,
          count: group._count.id
        }))
      };
    } catch (error) {
      console.error('Error in getMembershipReport:', error);
      // Return empty data on error
      return {
        summary: {
          total: 0,
          active: 0,
          new: 0,
          expiring: 0
        },
        byType: []
      };
    }
  }

  /**
   * Reporte de asistencia (versión simplificada)
   */
  async getAttendanceReport(filters = {}) {
    const { startDate, endDate, branchId } = filters;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const checkInWhere = {};
    if (startDate || endDate) checkInWhere.checkInAt = dateFilter;
    if (branchId) checkInWhere.branchId = branchId;

    try {
      const [
        totalCheckIns,
        uniqueMembers,
        averageVisitsPerMember
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
        })
      ]);

      return {
        summary: {
          totalCheckIns,
          uniqueMembers,
          averageVisitsPerMember
        },
        peakHours: [], // Simplificado - devolvemos array vacío por ahora
        dailyTrend: [], // Simplificado - devolvemos array vacío por ahora
        membershipUsage: [], // Simplificado - devolvemos array vacío por ahora
        branchDistribution: [] // Simplificado - devolvemos array vacío por ahora
      };
    } catch (error) {
      console.error('Error in getAttendanceReport:', error);
      // Return empty data on error
      return {
        summary: {
          totalCheckIns: 0,
          uniqueMembers: 0,
          averageVisitsPerMember: 0
        },
        peakHours: [],
        dailyTrend: [],
        membershipUsage: [],
        branchDistribution: []
      };
    }
  }

  /**
   * Reporte de ingresos (versión simplificada)
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

    try {
      const [
        totalRevenueResult,
        totalPayments,
        revenueByMethod
      ] = await Promise.all([
        // Ingresos totales
        prisma.payment.aggregate({
          where: paymentWhere,
          _sum: { amount: true }
        }),
        
        // Total de pagos
        prisma.payment.count({ where: paymentWhere }),
        
        // Ingresos por método de pago
        prisma.payment.groupBy({
          by: ['method'],
          where: paymentWhere,
          _sum: { amount: true },
          _count: { id: true }
        })
      ]);

      const totalRevenue = totalRevenueResult._sum.amount || 0;

      return {
        totalRevenue: totalRevenue ? parseFloat(totalRevenue.toString()) : 0,
        totalPayments,
        byMethod: revenueByMethod.map(method => ({
          method: method.method,
          amount: method._sum.amount ? parseFloat(method._sum.amount.toString()) : 0,
          count: method._count.id
        }))
      };
    } catch (error) {
      console.error('Error in getRevenueReport:', error);
      // Return empty data on error
      return {
        totalRevenue: 0,
        totalPayments: 0,
        byMethod: []
      };
    }
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
        today: todayRevenue ? parseFloat(todayRevenue.toString()) : 0,
        month: monthRevenue ? parseFloat(monthRevenue.toString()) : 0
      }
    };
  }
}

module.exports = new ReportService();