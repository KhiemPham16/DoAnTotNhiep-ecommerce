const { AppError } = require('~/errors/AppError');

function validateCreateProductPayload(data = {}) {
    const { title, categoryId, author, price, tagline } = data;

    if (!title || !categoryId || !author || !tagline || price === undefined) {
        throw new AppError(400, 'Thiếu thông tin sản phẩm');
    }

    if (tagline && tagline.length > 255) {
        throw new AppError(400, 'Tagline không được vượt quá 255 ký tự');
    }
}

module.exports = {
    validateCreateProductPayload
};
