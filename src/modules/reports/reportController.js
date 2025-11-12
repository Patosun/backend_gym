const reportService = require('./reportService');
const { asyncHandler } = require('../../middlewares/validation');

class ReportController {
  /**
   * @desc    Reporte de membresías
   * @route   GET /api/reports/memberships
   * @access  Private (Admin/Employee)
   */
  getMembershipReport = asyncHandler(async (req, res) => {
    const report = await reportService.getMembershipReport(req.query);
    
    res.json({
      success: true,
      data: report
    });
  });

  /**
   * @desc    Reporte de asistencia
   * @route   GET /api/reports/attendance
   * @access  Private (Admin/Employee)
   */
  getAttendanceReport = asyncHandler(async (req, res) => {
    const report = await reportService.getAttendanceReport(req.query);
    
    res.json({
      success: true,
      data: report
    });
  });

  /**
   * @desc    Reporte de ingresos
   * @route   GET /api/reports/revenue
   * @access  Private (Admin/Employee)
   */
  getRevenueReport = asyncHandler(async (req, res) => {
    const report = await reportService.getRevenueReport(req.query);
    
    res.json({
      success: true,
      data: report
    });
  });

  /**
   * @desc    Dashboard con estadísticas generales
   * @route   GET /api/reports/dashboard
   * @access  Private (Admin/Employee)
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await reportService.getDashboardStats(req.query);
    
    res.json({
      success: true,
      data: stats
    });
  });
}

module.exports = new ReportController();