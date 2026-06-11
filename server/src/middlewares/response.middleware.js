function responseMiddleware(req, res, next) {
    res.success = (httpStatus, data, extras = {}) => {
        const body = { success: true, data };
        if (extras.message !== undefined) {
            body.message = extras.message;
        }
        if (extras.meta !== undefined) {
            body.meta = extras.meta;
        }
        res.status(httpStatus).json(body);
    };

    res.error = (httpStatus, message, options = {}) => {
        const body = { success: false, message };
        if (options.code !== undefined) {
            body.code = options.code;
        }
        if (options.details !== undefined) {
            body.details = options.details;
        }
        res.status(httpStatus).json(body);
    };

    next();
}

module.exports = { responseMiddleware };
