const { AppError } = require('~/errors/AppError');

const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

function validateToken(token) {
    if (!token) {
        throw new AppError(400, 'Token không tồn tại');
    }
}

function validateRegisterPayload(fullName, email, password, phone) {
    if (!password || !email || !fullName || !phone) {
        throw new AppError(400, 'Thiếu thông tin bắt buộc');
    }

    if (!PHONE_REGEX.test(phone)) {
        throw new AppError(400, 'Số điện thoại không hợp lệ');
    }
}

function validateLoginPayload(email, password) {
    if (!email || !password) {
        throw new AppError(400, 'Thiếu thông tin bắt buộc');
    }
}

function validateRefreshToken(refreshToken) {
    if (!refreshToken) {
        throw new AppError(401, 'Token không tồn tại');
    }
}

function validateForgotPasswordPayload(email) {
    if (!email) {
        throw new AppError(400, 'Email là bắt buộc');
    }
}

function validateResetPasswordPayload(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
        throw new AppError(400, 'Thiếu thông tin bắt buộc');
    }
}

function validateChangePasswordPayload(currentPassword, newPassword, confirmNewPassword) {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new AppError(400, 'Thiếu thông tin bắt buộc');
    }

    if (newPassword !== confirmNewPassword) {
        throw new AppError(400, 'Xác nhận mật khẩu mới không khớp');
    }
}

module.exports = {
    validateToken,
    validateRegisterPayload,
    validateLoginPayload,
    validateRefreshToken,
    validateForgotPasswordPayload,
    validateResetPasswordPayload,
    validateChangePasswordPayload
};
