const express = require('express');
const polizaController = require('../controllers/poliza.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/', authMiddleware, polizaController.getAll);
router.get('/karateca/:id', authMiddleware, polizaController.getByKarateca);
router.post('/', authMiddleware, requireRole('SENSEI'), polizaController.create);
router.delete('/karateca/:id', authMiddleware, requireRole('SENSEI'), polizaController.removeAll);
router.put('/:id', authMiddleware, requireRole('SENSEI'), polizaController.update);
router.delete('/:id', authMiddleware, requireRole('SENSEI'), polizaController.remove);

module.exports = router;
