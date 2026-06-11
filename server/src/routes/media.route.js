const express = require('express');

const router = express.Router();

const mediaController = require('~/controllers/media.controller');

const { authenticate } = require('~/middlewares/authenticate.middleware');
const { authorize } = require('~/middlewares/rbac.middleware');
// const upload = require('~/middlewares/uploadAvatar');
const { uploadMedia } = require('~/middlewares/uploadMedia.middleware');

router.use(authenticate);

router.post('/upload', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), uploadMedia.single('file'), mediaController.upload);

router.get('/', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), mediaController.index);

router.get('/:id', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), mediaController.show);

router.patch('/:id', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), mediaController.update);

router.delete('/:id', authorize('ADMIN', 'MANAGER'), mediaController.destroy);

module.exports = router;
