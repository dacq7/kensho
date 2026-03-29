const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/resumen', authMiddleware, requireRole('SENSEI'), dashboardController.getResumen);
router.get('/karateca', authMiddleware, requireRole('KARATECA'), dashboardController.getResumenKarateca);

module.exports = router;
