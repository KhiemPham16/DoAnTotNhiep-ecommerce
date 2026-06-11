const nodemailer = require('nodemailer');
const mailConfig = require('~/configs/mail.config');

const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: Number(mailConfig.port),
    secure: mailConfig.secure === 'true',
    auth: {
        user: mailConfig.appUser,
        pass: mailConfig.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = { transporter };
