const express = require('express');
const configController = require('../controllers/config.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/', authMiddleware, requireRole('SENSEI'), configController.set);
router.get('/:clave', authMiddleware, configController.get);

module.exports = router;
