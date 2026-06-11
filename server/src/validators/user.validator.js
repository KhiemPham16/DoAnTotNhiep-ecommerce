const { AppError } = require('~/errors/AppError');

function validateUpdateAvatarPayload(file) {
    if (!file) {
        throw new AppError(400, 'Avatar là bắt buộc');
    }
}

function validateCreateUserPayload(data = {}) {
    const { fullName, email, password, phone } = data;

    if (!fullName || !email || !password || !phone) {
        throw new AppError(400, 'Thiếu thông tin bắt buộc');
    }
}

module.exports = {
    validateUpdateAvatarPayload,
    validateCreateUserPayload
};
