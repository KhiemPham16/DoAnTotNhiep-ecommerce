const n = parseInt(process.env.AUTH_BCRYPT_ROUNDS, 10);

const authConfig = {
    bcryptRounds: Number.isFinite(n) && n > 0 ? n : 10,
    verifyTokenExpires: process.env.AUTH_VERIFY_TOKEN_EXPIRES || '4h',
    accessTokenExpires: process.env.AUTH_ACCESS_TOKEN_EXPIRES || '15m',
    refreshTokenExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES || '7d',
    verifyJwtSecret: process.env.AUTH_VERIFY_JWT || '',
    accessJwtSecret: process.env.AUTH_ACCESS_JWT || ''
};

module.exports = authConfig;
