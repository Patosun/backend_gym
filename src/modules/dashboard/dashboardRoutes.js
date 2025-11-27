const express = require('express');
const dashboardController = require('./dashboardController');
const { authenticateToken } = require('../../middlewares/auth');
const { audit } = require('../../middlewares/audit');

const router = express.Router();

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

module.exports = router;