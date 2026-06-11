const { AppError } = require('~/errors/AppError');

function validateCreateProductPayload(data = {}) {
    const { title, categoryId, author, price } = data;

    if (!title || !categoryId || !author || price === undefined) {
        throw new AppError(400, 'Thiếu thông tin sản phẩm');
    }
}

module.exports = {
    validateCreateProductPayload
};
