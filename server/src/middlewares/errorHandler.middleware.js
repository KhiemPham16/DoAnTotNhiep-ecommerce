const { AppError } = require('~/errors/AppError');
const app = require('~/configs/app.config');

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        next(err);
        return;
    }

    if (err.name === 'MulterError') {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn (tối đa 2MB)' : err.message || 'Upload thất bại';
        if (typeof res.error === 'function') {
            res.error(400, msg);
            return;
        }
        res.status(400).json({ success: false, message: msg });
        return;
    }

    if (
        err.message &&
        (err.message.includes('Chỉ chấp nhận') || err.message.includes('JPEG') || err.message.includes('PNG'))
    ) {
        if (typeof res.error === 'function') {
            res.error(400, err.message);
            return;
        }
        res.status(400).json({ success: false, message: err.message });
        return;
    }

    const status = err instanceof AppError ? err.statusCode : err.statusCode || err.status || 500;

    const message =
        status === 500 && app.nodeEnv === 'production'
            ? 'Internal Server Error'
            : err.message || 'Internal Server Error';

    if (typeof res.error === 'function') {
        res.error(status, message);
        return;
    }

    res.status(status).json({ success: false, message });
}

module.exports = { errorHandler };
