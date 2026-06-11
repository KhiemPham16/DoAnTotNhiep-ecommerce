const express = require('express');
const reviewController = require('~/controllers/review.controller');
const { authenticate } = require('~/middlewares/authenticate.middleware');

const router = express.Router();

router.post('/', authenticate, reviewController.createReview);
router.get('/products/:productId', reviewController.getProductReviews);
router.get('/products/:productId/can-review', authenticate, reviewController.canReview);
router.patch('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
