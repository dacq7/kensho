const express = require('express');
const inventarioController = require('../controllers/inventario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/', authMiddleware, inventarioController.getAll);
router.post('/', authMiddleware, requireRole('SENSEI'), inventarioController.create);
router.put('/:id', authMiddleware, requireRole('SENSEI'), inventarioController.update);
router.delete('/:id', authMiddleware, requireRole('SENSEI'), inventarioController.remove);

module.exports = router;
