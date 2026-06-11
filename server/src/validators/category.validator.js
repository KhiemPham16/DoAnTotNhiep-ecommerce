const { AppError } = require('~/errors/AppError');

function validateCreateCategoryPayload(name) {
    if (!name) {
        throw new AppError(400, 'Tên danh mục là bắt buộc');
    }
}

module.exports = {
    validateCreateCategoryPayload
};
