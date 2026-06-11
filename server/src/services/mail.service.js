const path = require('path');
const ejs = require('ejs');

const mailConfig = require('~/configs/mail.config');
const appConfig = require('~/configs/app.config');

const { transporter } = require('~/libs/mailer');

class MailService {
    getTemplatePath(template) {
        return path.join(__dirname, '..', 'resources', 'mail', `${template.replace('.ejs', '')}.ejs`);
    }

    async send(options) {
        const { template, templateData = {}, ...restOptions } = options;

        const templatePath = this.getTemplatePath(template);
        const html = await ejs.renderFile(templatePath, templateData);

        return transporter.sendMail({
            ...restOptions,
            html
        });
    }

    async sendVerificationEmail(user, verificationLink) {
        const { appUser, fromName } = mailConfig;

        return this.send({
            from: `"${fromName}" <${appUser}>`,
            to: user.email,
            subject: 'Xác thực email',
            template: 'auth/verifyEmail',
            templateData: {
                fullName: user.fullName,
                appName: appConfig.appName,
                verifyUrl: verificationLink
            }
        });
    }

    async sendGreetingEmail(user) {
        const { appUser, fromName } = mailConfig;

        return this.send({
            from: `"${fromName}" <${appUser}>`,
            to: user.email,
            subject: 'Chào mừng bạn đến với hệ thống',
            template: 'auth/greetingEmail',
            templateData: {
                userName: user.fullName,
                appName: appConfig.appName
            }
        });
    }

    async sendChangePasswordEmail(user) {
        const { appUser, fromName } = mailConfig;

        return this.send({
            from: `"${fromName}" <${appUser}>`,
            to: user.email,
            subject: 'Thông báo đổi mật khẩu',
            template: 'auth/changePasswordEmail',
            templateData: {
                userName: user.fullName,
                appName: appConfig.appName,
                changeTime: new Date().toLocaleString('vi-VN'),
                supportLink: appConfig.supportUrl || 'mailto:support@devchill.id.vn'
            }
        });
    }

    async sendForgotPasswordOtpEmail(user, otp) {
        const { appUser, fromName } = mailConfig;

        return this.send({
            from: `"${fromName}" <${appUser}>`,
            to: user.email,
            subject: 'Mã OTP đặt lại mật khẩu',
            template: 'auth/forgotPasswordOTP',
            templateData: {
                userName: user.fullName,
                appName: appConfig.appName,
                otp,
                expiresIn: '30 phút'
            }
        });
    }
}

module.exports = new MailService();
