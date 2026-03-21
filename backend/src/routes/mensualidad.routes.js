const express = require('express');
const mensualidadController = require('../controllers/mensualidad.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/karateca/:id', authMiddleware, mensualidadController.getByKarateca);
router.post('/', authMiddleware, requireRole('SENSEI'), mensualidadController.create);
router.patch('/:id/pagar', authMiddleware, requireRole('SENSEI'), mensualidadController.pagar);

module.exports = router;
