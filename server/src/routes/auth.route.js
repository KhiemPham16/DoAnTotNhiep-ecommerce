const express = require('express');

const router = express.Router();

const authController = require('~/controllers/auth.controller');
const { authenticate } = require('~/middlewares/authenticate.middleware');
const { authLimiter } = require('~/middlewares/rateLimit.middleware');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/verify-email', authLimiter, authController.verifyEmail);

router.post('/logout', authLimiter, authController.logout);
router.post('/refresh', authLimiter, authController.refreshToken);

router.patch('/change-password', authenticate, authLimiter, authController.changePassword);

router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
