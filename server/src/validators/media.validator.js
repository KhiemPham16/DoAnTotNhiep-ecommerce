const { AppError } = require('~/errors/AppError');

function validateUploadMediaPayload(file) {
    if (!file) {
        throw new AppError(400, 'File là bắt buộc');
    }
}

module.exports = {
    validateUploadMediaPayload
};
