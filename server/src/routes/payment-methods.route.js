const express = require('express');

const router = express.Router();

const paymentMethodController = require('~/controllers/paymentMethod.controller');

const { authenticate } = require('~/middlewares/authenticate.middleware');
const { authorize } = require('~/middlewares/rbac.middleware');

// Public / customer checkout
router.get('/active', paymentMethodController.active);

// ADMIN / MANAGER
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), paymentMethodController.index);

router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER'), paymentMethodController.show);

router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), paymentMethodController.store);

router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER'), paymentMethodController.update);

router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), paymentMethodController.destroy);

module.exports = router;
