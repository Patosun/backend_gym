const checkInService = require('./checkInService');
const { asyncHandler } = require('../../middlewares/validation');
const prisma = require('../../config/prisma');

class CheckInController {
  /**
   * @desc    Realizar check-in mediante QR
   * @route   POST /api/checkins
   * @access  Public (con QR válido)
   */
  checkIn = asyncHandler(async (req, res) => {
    const { qrCode, branchId } = req.body;
    const checkIn = await checkInService.checkIn(qrCode, branchId);
    
    res.status(201).json({
      success: true,
      message: `¡Bienvenido ${checkIn.member.user.firstName}!`,
      data: checkIn
    });
  });

  /**
   * @desc    Realizar check-out
   * @route   PUT /api/checkins/:id/checkout
   * @access  Private (Employee/Admin/Member owner)
   */
  checkOut = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const checkIn = await checkInService.checkOut(id, notes);
    
    res.json({
      success: true,
      message: `¡Hasta luego ${checkIn.member.user.firstName}!`,
      data: checkIn
    });
  });

  /**
   * @desc    Obtener historial de check-ins
   * @route   GET /api/checkins
   * @access  Private
   */
  getCheckInHistory = asyncHandler(async (req, res) => {
    // Si es miembro, solo puede ver sus propios check-ins
    if (req.user.role === 'MEMBER') {
      const member = await prisma.member.findUnique({
        where: { userId: req.user.id }
      });
      if (member) {
        req.query.memberId = member.id;
      }
    }
    
    const result = await checkInService.getCheckInHistory(req.query);
    
    res.json({
      success: true,
      data: result
    });
  });

  /**
   * @desc    Obtener check-ins activos
   * @route   GET /api/checkins/active
   * @access  Private (Employee/Admin)
   */
  getActiveCheckIns = asyncHandler(async (req, res) => {
    const { branchId } = req.query;
    const activeCheckIns = await checkInService.getActiveCheckIns(branchId);
    
    res.json({
      success: true,
      data: activeCheckIns
    });
  });

  /**
   * @desc    Obtener estadísticas de asistencia
   * @route   GET /api/checkins/stats
   * @access  Private (Employee/Admin)
   */
  getAttendanceStats = asyncHandler(async (req, res) => {
    const stats = await checkInService.getAttendanceStats(req.query);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * @desc    Forzar check-out automático
   * @route   POST /api/checkins/force-checkout
   * @access  Private (Admin only)
   */
  forceCheckOut = asyncHandler(async (req, res) => {
    const { hoursThreshold = 24 } = req.body;
    const count = await checkInService.forceCheckOutOldVisits(hoursThreshold);
    
    res.json({
      success: true,
      message: `Se realizó check-out automático a ${count} visitas`,
      data: { count }
    });
  });

  /**
   * @desc    Obtener mi check-in activo (para miembros)
   * @route   GET /api/checkins/my-active
   * @access  Private (Member only)
   */
  getMyActiveCheckIn = asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
      where: { userId: req.user.id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de miembro no encontrado'
      });
    }

    const activeCheckIn = await prisma.checkIn.findFirst({
      where: {
        memberId: member.id,
        checkOutAt: null
      },
      include: {
        branch: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy: { checkInAt: 'desc' }
    });

    res.json({
      success: true,
      data: activeCheckIn
    });
  });
}

module.exports = new CheckInController();