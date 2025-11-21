const prisma = require('../../config/prisma');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class CheckInService {
  /**
   * Realizar check-in mediante QR
   */
  async checkIn(qrCode, branchId) {
    try {
      console.log('🔍 CheckIn: Iniciando check-in con:', { qrCode, branchId });
      
      // Buscar miembro por QR code
      const member = await prisma.member.findUnique({
        where: { qrCode },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              isActive: true
            }
          },
          memberships: {
            where: {
              status: 'ACTIVE',
              startDate: { lte: new Date() },
              endDate: { gte: new Date() }
            },
            include: {
              membershipType: true
            },
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      });

      console.log('🔍 CheckIn: Miembro encontrado:', !!member);
      if (member) {
        console.log('🔍 CheckIn: Datos del miembro:', {
          id: member.id,
          firstName: member.user.firstName,
          isActive: member.user.isActive,
          qrCodeExpiry: member.qrCodeExpiry,
          membershipsCount: member.memberships.length
        });
      }

    if (!member) {
      console.log('❌ CheckIn: Código QR inválido:', qrCode);
      throw new Error('Código QR inválido');
    }

    if (!member.user.isActive) {
      console.log('❌ CheckIn: Usuario inactivo:', member.user.email);
      throw new Error('Usuario inactivo');
    }

    // Verificar si el QR ha expirado
    if (new Date() > member.qrCodeExpiry) {
      console.log('❌ CheckIn: QR expirado:', { 
        now: new Date(), 
        expiry: member.qrCodeExpiry 
      });
      throw new Error('Código QR expirado');
    }

    // Verificar membresía activa
    if (!member.memberships || member.memberships.length === 0) {
      console.log('❌ CheckIn: Sin membresía activa');
      throw new Error('No tienes una membresía activa');
    }

    // Verificar si ya tiene un check-in activo (sin check-out)
    const activeCheckIn = await prisma.checkIn.findFirst({
      where: {
        memberId: member.id,
        checkOutAt: null
      },
      orderBy: { checkInAt: 'desc' }
    });

    if (activeCheckIn) {
      console.log('❌ CheckIn: Check-in ya activo:', activeCheckIn.id);
      throw new Error('Ya tienes un check-in activo. Debes hacer check-out primero.');
    }

    // Verificar que la sucursal existe y está activa
    console.log('🔍 CheckIn: Verificando sucursal:', branchId);
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    console.log('🔍 CheckIn: Sucursal encontrada:', !!branch);
    if (branch) {
      console.log('🔍 CheckIn: Datos de la sucursal:', {
        id: branch.id,
        name: branch.name,
        isActive: branch.isActive
      });
    }

    if (!branch || !branch.isActive) {
      console.log('❌ CheckIn: Sucursal no encontrada o inactiva');
      throw new Error('Sucursal no encontrada o inactiva');
    }

    console.log('✅ CheckIn: Todas las validaciones pasaron, creando check-in...');

    // Crear check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        memberId: member.id,
        branchId
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
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    console.log('✅ CheckIn: Check-in creado exitosamente:', checkIn.id);
    return checkIn;
    
    } catch (error) {
      console.error('❌ CheckIn: Error en checkIn:', error.message);
      console.error('❌ CheckIn: Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Realizar check-out
   */
  async checkOut(checkInId, notes = null) {
    // Buscar check-in activo
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
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
        },
        branch: {
          select: {
            name: true
          }
        }
      }
    });

    if (!checkIn) {
      throw new Error('Check-in no encontrado');
    }

    if (checkIn.checkOutAt) {
      throw new Error('Ya se realizó el check-out para esta visita');
    }

    // Actualizar check-in con check-out
    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        checkOutAt: new Date(),
        notes
      },
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
        },
        branch: {
          select: {
            name: true
          }
        }
      }
    });

    return updatedCheckIn;
  }

  /**
   * Obtener historial de check-ins
   */
  async getCheckInHistory(filters = {}) {
    const { 
      page = 1, 
      limit = 10, 
      memberId, 
      branchId, 
      startDate, 
      endDate,
      activeOnly = false 
    } = filters;
    
    const skip = (page - 1) * limit;
    
    const where = {};
    if (memberId) where.memberId = memberId;
    if (branchId) where.branchId = branchId;
    if (activeOnly) where.checkOutAt = null;
    
    if (startDate || endDate) {
      where.checkInAt = {};
      if (startDate) where.checkInAt.gte = new Date(startDate);
      if (endDate) where.checkInAt.lte = new Date(endDate);
    }

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' },
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
          branch: {
            select: {
              name: true,
              address: true,
              city: true
            }
          }
        }
      }),
      prisma.checkIn.count({ where })
    ]);

    return {
      checkIns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener check-ins activos (sin check-out)
   */
  async getActiveCheckIns(branchId = null) {
    const where = { checkOutAt: null };
    if (branchId) where.branchId = branchId;

    const activeCheckIns = await prisma.checkIn.findMany({
      where,
      orderBy: { checkInAt: 'desc' },
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
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    return activeCheckIns;
  }

  /**
   * Obtener estadísticas de asistencia
   */
  async getAttendanceStats(filters = {}) {
    const { branchId, startDate, endDate } = filters;
    
    const where = {};
    if (branchId) where.branchId = branchId;
    
    if (startDate || endDate) {
      where.checkInAt = {};
      if (startDate) where.checkInAt.gte = new Date(startDate);
      if (endDate) where.checkInAt.lte = new Date(endDate);
    }

    const [
      totalCheckIns,
      uniqueMembers,
      averageVisitsPerMember,
      checkInsByHour,
      checkInsByDay
    ] = await Promise.all([
      // Total check-ins
      prisma.checkIn.count({ where }),
      
      // Miembros únicos
      prisma.checkIn.findMany({
        where,
        select: { memberId: true },
        distinct: ['memberId']
      }).then(result => result.length),
      
      // Promedio de visitas por miembro
      prisma.checkIn.groupBy({
        by: ['memberId'],
        where,
        _count: { id: true }
      }).then(result => {
        if (result.length === 0) return 0;
        const total = result.reduce((sum, item) => sum + item._count.id, 0);
        return Math.round((total / result.length) * 100) / 100;
      }),
      
      // Check-ins por hora del día
      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM "checkInAt") as hour, COUNT(*) as count
        FROM check_ins
        ${branchId ? prisma.$queryRaw`WHERE "branchId" = ${branchId}` : prisma.$queryRaw``}
        GROUP BY EXTRACT(HOUR FROM "checkInAt")
        ORDER BY hour
      `,
      
      // Check-ins por día de la semana
      prisma.$queryRaw`
        SELECT EXTRACT(DOW FROM "checkInAt") as day, COUNT(*) as count
        FROM check_ins
        ${branchId ? prisma.$queryRaw`WHERE "branchId" = ${branchId}` : prisma.$queryRaw``}
        GROUP BY EXTRACT(DOW FROM "checkInAt")
        ORDER BY day
      `
    ]);

    return {
      totalCheckIns,
      uniqueMembers,
      averageVisitsPerMember,
      checkInsByHour,
      checkInsByDay
    };
  }

  /**
   * Forzar check-out automático para visitas abiertas muy antiguas
   */
  async forceCheckOutOldVisits(hoursThreshold = 24) {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    const result = await prisma.checkIn.updateMany({
      where: {
        checkOutAt: null,
        checkInAt: { lt: thresholdDate }
      },
      data: {
        checkOutAt: new Date(),
        notes: 'Check-out automático por tiempo excedido'
      }
    });

    return result.count;
  }

  /**
   * Realizar check-in administrativo por memberId (sin necesidad de QR)
   */
  async adminCheckIn(memberId, branchId) {
    // Buscar miembro por ID
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isActive: true
          }
        },
        memberships: {
          where: {
            status: 'ACTIVE',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          },
          include: {
            membershipType: true
          },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!member) {
      throw new Error('Miembro no encontrado');
    }

    if (!member.user.isActive) {
      throw new Error('Usuario inactivo');
    }

    // Verificar membresía activa
    if (!member.memberships || member.memberships.length === 0) {
      throw new Error('No tiene una membresía activa');
    }

    // Verificar si ya tiene un check-in activo (sin check-out)
    const activeCheckIn = await prisma.checkIn.findFirst({
      where: {
        memberId: member.id,
        checkOutAt: null
      },
      orderBy: { checkInAt: 'desc' }
    });

    if (activeCheckIn) {
      throw new Error('Ya tiene un check-in activo. Debe hacer check-out primero.');
    }

    // Verificar que la sucursal existe y está activa
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch || !branch.isActive) {
      throw new Error('Sucursal no encontrada o inactiva');
    }

    // Crear check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        memberId: member.id,
        branchId
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
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    return checkIn;
  }

  /**
   * Realizar check-out administrativo por memberId
   */
  async adminCheckOut(memberId) {
    // Buscar check-in activo
    const activeCheckIn = await prisma.checkIn.findFirst({
      where: {
        memberId,
        checkOutAt: null
      },
      orderBy: { checkInAt: 'desc' },
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
        },
        branch: {
          select: {
            name: true
          }
        }
      }
    });

    if (!activeCheckIn) {
      throw new Error('No hay check-in activo para este miembro');
    }

    // Actualizar check-in con check-out
    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: activeCheckIn.id },
      data: {
        checkOutAt: new Date(),
        notes: 'Check-out administrativo'
      },
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
        },
        branch: {
          select: {
            name: true
          }
        }
      }
    });

    return updatedCheckIn;
  }

  /**
   * Generar QR code visual para check-ins desde el admin
   */
  async generateQRForCheckin(branchId, adminUserId) {
    // Verificar que la sucursal existe
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true }
    });

    if (!branch) {
      throw new Error('Sucursal no encontrada');
    }

    // Generar un ID único para este QR
    const qrId = uuidv4();
    const timestamp = Date.now();
    
    // Crear la data del QR que incluirá información necesaria para el check-in
    const qrData = {
      type: 'checkin',
      branchId: branchId,
      qrId: qrId,
      timestamp: timestamp,
      generatedBy: adminUserId,
      expiresAt: timestamp + (24 * 60 * 60 * 1000) // Expira en 24 horas
    };

    // Convertir a string JSON
    const qrDataString = JSON.stringify(qrData);
    
    // Generar el QR code como imagen base64
    try {
      const qrCodeImage = await QRCode.toDataURL(qrDataString, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      return {
        qrCodeImage,
        qrData: qrData,
        qrDataString,
        branch: {
          id: branch.id,
          name: branch.name
        },
        expiresAt: new Date(qrData.expiresAt),
        instructions: 'Los usuarios pueden usar este QR code con la aplicación móvil para hacer check-in en esta sucursal.'
      };
    } catch (error) {
      throw new Error('Error generando el código QR: ' + error.message);
    }
  }
}

module.exports = new CheckInService();