const rateLimit = require('express-rate-limit');

const aiAdvisorLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    message: {
        success: false,
        message: 'Bạn gửi yêu cầu AI quá nhanh, vui lòng thử lại sau.'
    }
});

module.exports = { aiAdvisorLimiter };
