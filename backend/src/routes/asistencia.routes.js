const express = require('express');
const asistenciaController = require('../controllers/asistencia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/fechas', authMiddleware, asistenciaController.getFechas);
router.get('/fecha', authMiddleware, asistenciaController.getByFecha);
router.get('/karateca/:id', authMiddleware, asistenciaController.getByKarateca);
router.post('/', authMiddleware, requireRole('SENSEI'), asistenciaController.registrar);

module.exports = router;
