const express = require('express');
const mensualidadController = require('../controllers/mensualidad.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/mes', authMiddleware, mensualidadController.getByMes);
router.post('/pago', authMiddleware, requireRole('SENSEI'), mensualidadController.registrarPago);
router.patch('/:id/anular', authMiddleware, requireRole('SENSEI'), mensualidadController.anularPago);
router.get('/karateca/:id', authMiddleware, mensualidadController.getByKarateca);

module.exports = router;
