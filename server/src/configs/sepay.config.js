const sepayConfig = {
    env: process.env.ENV || 'sandbox',
    merchant_id: process.env.MERCHANT_ID,
    secret_key: process.env.SECRET_KEY
};

module.exports = sepayConfig;
