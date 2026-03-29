const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.patch('/change-password', authMiddleware, authController.changePassword);
router.patch(
  '/reset-password/:userId',
  authMiddleware,
  requireRole('SENSEI'),
  authController.resetPassword,
);

module.exports = router;
