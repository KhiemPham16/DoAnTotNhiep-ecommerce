const { AppError } = require('~/errors/AppError');

function validateCreateCouponPayload(data = {}) {
    const { couponType, code, type, value, expiresAt } = data;

    if (!couponType || !type || value === undefined || !expiresAt) {
        throw new AppError(400, 'Thiếu thông tin mã giảm giá');
    }

    const normalizedCouponType = String(couponType).toLowerCase();

    if (!['holiday', 'random', 'custom'].includes(normalizedCouponType)) {
        throw new AppError(400, 'Loại mã coupon không hợp lệ');
    }

    if (normalizedCouponType === 'custom' && !code) {
        throw new AppError(400, 'Vui lòng nhập mã coupon');
    }
}

function validateCouponPayload(code, totalAmount) {
    if (!code) {
        throw new AppError(400, 'Mã coupon là bắt buộc');
    }

    if (totalAmount === undefined || totalAmount < 0) {
        throw new AppError(400, 'Tổng tiền đơn hàng không hợp lệ');
    }
}

module.exports = {
    validateCreateCouponPayload,
    validateCouponPayload
};
