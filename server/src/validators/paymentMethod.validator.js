const { AppError } = require('~/errors/AppError');

function validateCreatePaymentMethodPayload(data = {}) {
    const { name, code } = data;

    if (!name || !code) {
        throw new AppError(400, 'Thiếu thông tin phương thức thanh toán');
    }
}

module.exports = {
    validateCreatePaymentMethodPayload
};
