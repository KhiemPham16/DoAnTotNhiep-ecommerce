const mailConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    appUser: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.MAIL_FROM
};

module.exports = mailConfig;
