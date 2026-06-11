const express = require('express');

const router = express.Router();

const productController = require('~/controllers/product.controller');

const { authenticate } = require('~/middlewares/authenticate.middleware');
const { authorize } = require('~/middlewares/rbac.middleware');

router.get('/', productController.index);
router.get('/:id', productController.show);

router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), productController.store);
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), productController.update);
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), productController.destroy);

module.exports = router;
