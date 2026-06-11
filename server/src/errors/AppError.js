class AppError extends Error {
    constructor(statusCode = 500, message = 'Internal Server Error') {
        super(message);

        this.name = 'AppError';
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { AppError };
