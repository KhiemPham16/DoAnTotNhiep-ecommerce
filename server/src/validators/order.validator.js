const { AppError } = require('~/errors/AppError');

function validateCreateOrderPayload(data = {}) {
    const { addressId, paymentMethodId, items } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'Giỏ hàng trống');
    }

    if (!addressId) {
        throw new AppError(400, 'Vui lòng chọn địa chỉ giao hàng');
    }

    if (!paymentMethodId) {
        throw new AppError(400, 'Vui lòng chọn phương thức thanh toán');
    }

    for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
            throw new AppError(400, 'Sản phẩm trong giỏ hàng không hợp lệ');
        }
    }
}

function validateOrderStatusPayload(status) {
    const nextStatus = String(status || '').toUpperCase();
    const allowedStatus = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

    if (!allowedStatus.includes(nextStatus)) {
        throw new AppError(400, 'Trạng thái đơn hàng không hợp lệ');
    }
}

function validatePaymentStatusPayload(paymentStatus) {
    const nextStatus = String(paymentStatus || '').toUpperCase();
    const allowedStatus = ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'];

    if (!allowedStatus.includes(nextStatus)) {
        throw new AppError(400, 'Trạng thái thanh toán không hợp lệ');
    }
}

module.exports = {
    validateCreateOrderPayload,
    validateOrderStatusPayload,
    validatePaymentStatusPayload
};
