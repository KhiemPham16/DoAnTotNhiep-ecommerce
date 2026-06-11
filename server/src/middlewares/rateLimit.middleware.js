const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau'
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Thao tác quá nhiều lần, vui lòng thử lại sau 1 phút'
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};
