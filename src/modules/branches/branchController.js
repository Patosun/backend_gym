const branchService = require('./branchService');
const { asyncHandler } = require('../../middlewares/validation');
const { audit } = require('../../middlewares/audit');

class BranchController {
  /**
   * @desc    Crear nueva sucursal
   * @route   POST /api/branches
   * @access  Private (Admin/Employee)
   */
  createBranch = asyncHandler(async (req, res) => {
    const branch = await branchService.createBranch(req.body, req.user.id);
    await audit.create(req, 'Branch', branch.id, branch);
    
    res.status(201).json({
      success: true,
      message: 'Sucursal creada exitosamente',
      data: branch
    });
  });

  /**
   * @desc    Obtener todas las sucursales
   * @route   GET /api/branches
   * @access  Private
   */
  getAllBranches = asyncHandler(async (req, res) => {
    const result = await branchService.getAllBranches(req.query);
    
    res.json({
      success: true,
      data: result
    });
  });

  /**
   * @desc    Obtener sucursal por ID
   * @route   GET /api/branches/:id
   * @access  Private
   */
  getBranchById = asyncHandler(async (req, res) => {
    const branch = await branchService.getBranchById(req.params.id);
    
    res.json({
      success: true,
      data: branch
    });
  });

  /**
   * @desc    Actualizar sucursal
   * @route   PUT /api/branches/:id
   * @access  Private (Admin/Employee)
   */
  updateBranch = asyncHandler(async (req, res) => {
    const branch = await branchService.updateBranch(req.params.id, req.body);
    await audit.update(req, 'Branch', branch.id, null, branch);
    
    res.json({
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: branch
    });
  });

  /**
   * @desc    Eliminar sucursal
   * @route   DELETE /api/branches/:id
   * @access  Private (Admin only)
   */
  deleteBranch = asyncHandler(async (req, res) => {
    await branchService.deleteBranch(req.params.id);
    
    res.json({
      success: true,
      message: 'Sucursal eliminada exitosamente'
    });
  });

  /**
   * @desc    Obtener estadísticas de sucursal
   * @route   GET /api/branches/:id/stats
   * @access  Private (Admin/Employee)
   */
  getBranchStats = asyncHandler(async (req, res) => {
    const stats = await branchService.getBranchStats(req.params.id, req.query);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * @desc    Obtener sucursales cercanas
   * @route   GET /api/branches/nearby
   * @access  Public
   */
  getNearbyBranches = asyncHandler(async (req, res) => {
    const { city, state } = req.query;
    const branches = await branchService.getNearbyBranches(city, state);
    
    res.json({
      success: true,
      data: branches
    });
  });
}

module.exports = new BranchController();