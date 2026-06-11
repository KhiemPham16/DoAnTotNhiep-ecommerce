const { AppError } = require('~/errors/AppError');

function validateCreateReviewPayload(data = {}) {
    const { productId, orderId, rating } = data;

    if (!productId || !orderId || !rating) {
        throw new AppError(400, 'Thiếu productId, orderId hoặc rating');
    }

    if (rating < 1 || rating > 5) {
        throw new AppError(400, 'Rating phải từ 1 đến 5');
    }
}

function validateUpdateReviewPayload(data = {}) {
    const { rating } = data;

    if (rating && (rating < 1 || rating > 5)) {
        throw new AppError(400, 'Rating phải từ 1 đến 5');
    }
}

module.exports = {
    validateCreateReviewPayload,
    validateUpdateReviewPayload
};
