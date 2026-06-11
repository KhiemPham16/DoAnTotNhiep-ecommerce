const { AppError } = require('~/errors/AppError');

const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

function validateUpsertAddressPayload(data = {}) {
    const { receiverName, receiverPhone, provinceCity, ward, specificAddress } = data;

    if (!receiverName || !receiverPhone || !provinceCity || !ward || !specificAddress) {
        throw new AppError(400, 'Thiếu thông tin bắt buộc');
    }

    if (!PHONE_REGEX.test(receiverPhone)) {
        throw new AppError(400, 'Số điện thoại không hợp lệ');
    }
}

module.exports = {
    validateUpsertAddressPayload
};
