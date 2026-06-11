const express = require('express');

const router = express.Router();

const userController = require('~/controllers/user.controller');

const { authenticate } = require('~/middlewares/authenticate.middleware');

const { authorize } = require('~/middlewares/rbac.middleware');

const { uploadAvatar } = require('~/middlewares/uploadAvatar.middleware');

router.get('/me', authenticate, userController.me);
router.patch('/me', authenticate, userController.updateMe);
router.patch('/me/avatar', authenticate, uploadAvatar.single('avatar'), userController.updateAvatar);
router.delete('/me', authenticate, userController.deleteMe);

router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), userController.index);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), userController.store);
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER'), userController.show);
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER'), userController.update);
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), userController.destroy);

module.exports = router;
