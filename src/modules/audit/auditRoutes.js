const express = require('express');
const { authenticateToken, authorize } = require('../../middlewares/auth');
const auditController = require('./auditController');

const router = express.Router();

/**
 * Todas las rutas de auditoría requieren autenticación
 * La mayoría requieren rol ADMIN
 */

// Obtener logs de auditoría (solo admin)
router.get('/logs',
  authenticateToken,
  authorize(['ADMIN']),
  auditController.getLogs
);

// Obtener historial de una entidad (solo admin)
router.get('/entity/:entity/:entityId',
  authenticateToken,
  authorize(['ADMIN']),
  auditController.getEntityHistory
);

// Obtener actividad de un usuario (admin o el mismo usuario)
router.get('/user/:userId',
  authenticateToken,
  auditController.getUserActivity
);

// Obtener estadísticas de auditoría (solo admin)
router.get('/stats',
  authenticateToken,
  authorize(['ADMIN']),
  auditController.getStats
);

// Limpiar logs antiguos (solo admin)
router.delete('/cleanup',
  authenticateToken,
  authorize(['ADMIN']),
  auditController.cleanOldLogs
);

module.exports = router;
