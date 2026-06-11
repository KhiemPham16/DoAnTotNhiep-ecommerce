const appConfig = {
    appName: process.env.APP_NAME || 'E-Commerce DevChill',
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
    corsOrigin: (process.env.CORS_ORIGIN || '').replace(/\/$/, '')
};

module.exports = appConfig;
