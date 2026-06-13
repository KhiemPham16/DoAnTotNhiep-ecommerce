const express = require('express');

const router = express.Router();

const orderController = require('~/controllers/order.controller');

const { authenticate } = require('~/middlewares/authenticate.middleware');
const { authorize } = require('~/middlewares/rbac.middleware');

router.use(authenticate);

// Customer
router.post('/', orderController.store);

router.get('/my-orders', orderController.myOrders);

router.get('/my-orders/:id', orderController.showMine);

router.patch('/my-orders/:id/cancel', orderController.cancelMine);

// Admin / Manager
router.get('/', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.index);

router.patch('/:id/status', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.updateStatus);

router.patch('/:id/payment-status', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.updatePaymentStatus);

router.patch('/:id/approve', authorize('ADMIN', 'MANAGER'), orderController.approve);

router.patch('/:id/assign', authorize('ADMIN', 'MANAGER'), orderController.assign);

router.patch('/:id/unassign', authorize('ADMIN', 'MANAGER'), orderController.unassign);

module.exports = router;
