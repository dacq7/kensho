const express = require('express');
const inventarioController = require('../controllers/inventario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

const sensei = [authMiddleware, requireRole('SENSEI')];

router.get('/', ...sensei, inventarioController.getAll);
router.post('/', ...sensei, inventarioController.create);
router.put('/:id', ...sensei, inventarioController.update);
router.delete('/:id', ...sensei, inventarioController.remove);

module.exports = router;
