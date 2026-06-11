const { AppError } = require('~/errors/AppError');

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError(401, 'Chưa đăng nhập');
        }

        if (!roles.includes(req.user.role)) {
            throw new AppError(403, 'Bạn không có quyền thực hiện hành động này');
        }

        next();
    };
}

module.exports = { authorize };
