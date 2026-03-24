const express = require('express');
const karatecaController = require('../controllers/karateca.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/', authMiddleware, karatecaController.getAll);
router.get('/:id', authMiddleware, karatecaController.getById);
router.post('/', authMiddleware, requireRole('SENSEI'), karatecaController.create);
router.put('/:id', authMiddleware, requireRole('SENSEI'), karatecaController.update);
router.patch('/:id/kyu', authMiddleware, requireRole('SENSEI'), karatecaController.updateKyu);
router.patch(
  '/:id/pre-examen',
  authMiddleware,
  requireRole('SENSEI'),
  karatecaController.updatePreExamen,
);
router.patch('/:id/activo', authMiddleware, requireRole('SENSEI'), karatecaController.toggleActivo);
router.delete('/:id', authMiddleware, requireRole('SENSEI'), karatecaController.remove);

module.exports = router;
