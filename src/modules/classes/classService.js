const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const classService = {
  // ===================
  // CLASSES
  // ===================

  /**
   * Obtener todas las clases con filtros y paginación
   */
  async getAllClasses(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    
    if (filters.branchId) whereClause.branchId = filters.branchId;
    if (filters.trainerId) whereClause.trainerId = filters.trainerId;
    if (filters.status) whereClause.status = filters.status;

    // Filtro por fechas
    if (filters.startDate || filters.endDate) {
      whereClause.startTime = {};
      if (filters.startDate) whereClause.startTime.gte = filters.startDate;
      if (filters.endDate) whereClause.startTime.lte = filters.endDate;
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          trainer: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          reservations: {
            where: { status: { not: 'CANCELLED' } },
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
          },
          _count: {
            select: {
              reservations: {
                where: { status: { not: 'CANCELLED' } }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { startTime: 'asc' }
      }),
      prisma.class.count({ where: whereClause })
    ]);

    return {
      classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Crear nueva clase
   */
  async createClass(data) {
    // Verificar que la sucursal existe
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId }
    });

    if (!branch || !branch.isActive) {
      throw new Error('Sucursal no encontrada o inactiva');
    }

    // Verificar que el entrenador existe y está activo
    const trainer = await prisma.trainer.findUnique({
      where: { id: data.trainerId },
      include: {
        user: {
          select: { isActive: true }
        }
      }
    });

    if (!trainer || !trainer.isActive || !trainer.user.isActive) {
      throw new Error('Entrenador no encontrado o inactivo');
    }

    // Verificar que el entrenador pertenece a la sucursal
    if (trainer.branchId !== data.branchId) {
      throw new Error('El entrenador no pertenece a esta sucursal');
    }

    // Verificar conflictos de horario del entrenador
    const conflictingClass = await prisma.class.findFirst({
      where: {
        trainerId: data.trainerId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingClass) {
      throw new Error('El entrenador ya tiene una clase programada en este horario');
    }

    const newClass = await prisma.class.create({
      data,
      include: {
        branch: {
          select: {
            name: true,
            address: true
          }
        },
        trainer: {
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

    return newClass;
  },

  /**
   * Obtener clase por ID
   */
  async getClassById(id) {
    return await prisma.class.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        trainer: {
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
        reservations: {
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
            }
          }
        },
        _count: {
          select: {
            reservations: {
              where: { status: { not: 'CANCELLED' } }
            }
          }
        }
      }
    });
  },

  /**
   * Actualizar clase
   */
  async updateClass(id, data) {
    try {
      // Si se actualiza el entrenador, verificar que existe y está activo
      if (data.trainerId) {
        const trainer = await prisma.trainer.findUnique({
          where: { id: data.trainerId },
          include: {
            user: { select: { isActive: true } }
          }
        });

        if (!trainer || !trainer.isActive || !trainer.user.isActive) {
          throw new Error('Entrenador no encontrado o inactivo');
        }

        // Verificar conflictos de horario si se cambia entrenador o horario
        const currentClass = await prisma.class.findUnique({
          where: { id }
        });

        if (currentClass) {
          const startTime = data.startTime || currentClass.startTime;
          const endTime = data.endTime || currentClass.endTime;

          const conflictingClass = await prisma.class.findFirst({
            where: {
              id: { not: id },
              trainerId: data.trainerId,
              status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
              OR: [
                {
                  AND: [
                    { startTime: { lte: startTime } },
                    { endTime: { gt: startTime } }
                  ]
                },
                {
                  AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gte: endTime } }
                  ]
                }
              ]
            }
          });

          if (conflictingClass) {
            throw new Error('El entrenador ya tiene una clase programada en este horario');
          }
        }
      }

      return await prisma.class.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          branch: {
            select: {
              name: true,
              address: true
            }
          },
          trainer: {
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
          reservations: {
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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Clase no encontrada');
      }
      throw error;
    }
  },

  /**
   * Cancelar clase y notificar a miembros
   */
  async cancelClass(id, reason = null) {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED'] } },
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
        }
      }
    });

    if (!classData) {
      throw new Error('Clase no encontrada');
    }

    if (classData.status === 'COMPLETED') {
      throw new Error('No se puede cancelar una clase ya completada');
    }

    if (classData.status === 'CANCELLED') {
      throw new Error('La clase ya está cancelada');
    }

    // Cancelar la clase
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        description: reason ? `${classData.description || ''}\nCancelada: ${reason}`.trim() : classData.description,
        updatedAt: new Date()
      },
      include: {
        branch: { select: { name: true } },
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    // Cancelar todas las reservas
    await prisma.reservation.updateMany({
      where: {
        classId: id,
        status: 'CONFIRMED'
      },
      data: {
        status: 'CANCELLED',
        notes: `Clase cancelada${reason ? `: ${reason}` : ''}`,
        updatedAt: new Date()
      }
    });

    return {
      class: updatedClass,
      notifiedMembers: classData.reservations.length
    };
  },

  // ===================
  // RESERVATIONS
  // ===================

  /**
   * Obtener reservas de una clase
   */
  async getClassReservations(classId) {
    return await prisma.reservation.findMany({
      where: { classId },
      include: {
        member: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                photo: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  /**
   * Crear nueva reserva
   */
  async createReservation(data) {
    // Verificar que el miembro existe y está activo
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
      include: {
        user: { select: { isActive: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!member || !member.isActive || !member.user.isActive) {
      throw new Error('Miembro no encontrado o inactivo');
    }

    if (member.memberships.length === 0) {
      throw new Error('El miembro no tiene una membresía activa');
    }

    // Verificar que la clase existe y está programada
    const classData = await prisma.class.findUnique({
      where: { id: data.classId },
      include: {
        trainer: true,
        _count: {
          select: {
            reservations: {
              where: { status: { not: 'CANCELLED' } }
            }
          }
        }
      }
    });

    if (!classData) {
      throw new Error('Clase no encontrada');
    }

    if (classData.status !== 'SCHEDULED') {
      throw new Error('Solo se pueden hacer reservas para clases programadas');
    }

    // Verificar que la clase no haya pasado
    if (classData.startTime < new Date()) {
      throw new Error('No se pueden hacer reservas para clases pasadas');
    }

    // Verificar capacidad disponible
    if (classData._count.reservations >= classData.capacity) {
      throw new Error('La clase está llena');
    }

    // Verificar que el miembro no tiene ya una reserva para esta clase
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        memberId_classId: {
          memberId: data.memberId,
          classId: data.classId
        }
      }
    });

    if (existingReservation && existingReservation.status !== 'CANCELLED') {
      throw new Error('El miembro ya tiene una reserva para esta clase');
    }

    // Si existe pero está cancelada, actualizarla
    if (existingReservation && existingReservation.status === 'CANCELLED') {
      return await prisma.reservation.update({
        where: { id: existingReservation.id },
        data: {
          status: 'CONFIRMED',
          notes: data.notes,
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
          class: {
            include: {
              branch: { select: { name: true } }
            }
          }
        }
      });
    }

    // Crear nueva reserva
    const reservation = await prisma.reservation.create({
      data: {
        ...data,
        trainerId: classData.trainerId,
        status: 'CONFIRMED'
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
        class: {
          include: {
            branch: { select: { name: true } },
            trainer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      }
    });

    return reservation;
  },

  /**
   * Obtener reserva por ID
   */
  async getReservationById(id) {
    return await prisma.reservation.findUnique({
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
                phone: true
              }
            }
          }
        },
        class: {
          include: {
            branch: { select: { name: true, address: true } },
            trainer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      }
    });
  },

  /**
   * Actualizar reserva
   */
  async updateReservation(id, data) {
    try {
      return await prisma.reservation.update({
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
                  email: true
                }
              }
            }
          },
          class: {
            include: {
              branch: { select: { name: true } }
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Reserva no encontrada');
      }
      throw error;
    }
  },

  /**
   * Obtener reservas de un miembro
   */
  async getMemberReservations(memberId, filters = {}) {
    let whereClause = { memberId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.upcoming) {
      whereClause.class = {
        startTime: { gt: new Date() },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      };
    }

    return await prisma.reservation.findMany({
      where: whereClause,
      include: {
        class: {
          include: {
            branch: { select: { name: true, address: true } },
            trainer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      },
      orderBy: { class: { startTime: 'asc' } }
    });
  },

  /**
   * Obtener estadísticas de clases
   */
  async getClassStats(filters = {}) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Construir filtro base
    let baseFilter = {};
    if (filters.branchId) baseFilter.branchId = filters.branchId;
    if (filters.startDate) {
      baseFilter.startTime = { ...baseFilter.startTime, gte: filters.startDate };
    }
    if (filters.endDate) {
      baseFilter.startTime = { ...baseFilter.startTime, lte: filters.endDate };
    }

    const [
      totalClasses,
      scheduledClasses,
      completedClasses,
      cancelledClasses,
      totalReservations,
      confirmedReservations,
      averageAttendance,
      popularTimes
    ] = await Promise.all([
      // Total de clases
      prisma.class.count({ where: baseFilter }),

      // Clases programadas
      prisma.class.count({
        where: { ...baseFilter, status: 'SCHEDULED' }
      }),

      // Clases completadas
      prisma.class.count({
        where: { ...baseFilter, status: 'COMPLETED' }
      }),

      // Clases canceladas
      prisma.class.count({
        where: { ...baseFilter, status: 'CANCELLED' }
      }),

      // Total reservas
      prisma.reservation.count({
        where: {
          class: baseFilter
        }
      }),

      // Reservas confirmadas
      prisma.reservation.count({
        where: {
          class: baseFilter,
          status: 'CONFIRMED'
        }
      }),

      // Promedio de asistencia
      this.getAverageAttendance(baseFilter),

      // Horarios más populares
      this.getPopularTimes(baseFilter)
    ]);

    return {
      totalClasses,
      scheduledClasses,
      completedClasses,
      cancelledClasses,
      reservations: {
        total: totalReservations,
        confirmed: confirmedReservations,
        cancelled: totalReservations - confirmedReservations
      },
      averageAttendance,
      popularTimes
    };
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
   * Calcular promedio de asistencia
   */
  async getAverageAttendance(baseFilter) {
    const classes = await prisma.class.findMany({
      where: {
        ...baseFilter,
        status: 'COMPLETED'
      },
      include: {
        _count: {
          select: {
            reservations: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      },
      select: {
        capacity: true,
        _count: true
      }
    });

    if (classes.length === 0) return 0;

    const totalAttendance = classes.reduce((sum, cls) => sum + cls._count.reservations, 0);
    const totalCapacity = classes.reduce((sum, cls) => sum + cls.capacity, 0);

    return totalCapacity > 0 ? Math.round((totalAttendance / totalCapacity) * 100) : 0;
  },

  /**
   * Obtener horarios más populares
   */
  async getPopularTimes(baseFilter) {
    const classes = await prisma.class.findMany({
      where: baseFilter,
      include: {
        _count: {
          select: {
            reservations: {
              where: { status: { not: 'CANCELLED' } }
            }
          }
        }
      },
      select: {
        startTime: true,
        _count: true
      }
    });

    // Agrupar por hora del día
    const timeSlots = {};
    classes.forEach(cls => {
      const hour = cls.startTime.getHours();
      const timeSlot = `${hour}:00`;
      
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = { time: timeSlot, reservations: 0, classes: 0 };
      }
      
      timeSlots[timeSlot].reservations += cls._count.reservations;
      timeSlots[timeSlot].classes += 1;
    });

    // Convertir a array y ordenar por popularidad
    return Object.values(timeSlots)
      .sort((a, b) => b.reservations - a.reservations)
      .slice(0, 5);
  }
};

module.exports = classService;