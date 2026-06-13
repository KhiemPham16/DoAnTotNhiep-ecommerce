require('dotenv').config();
require('module-alias/register');

const { Worker } = require('bullmq');

const connection = require('~/queues/redis.connection');
const mailService = require('~/services/mail.service');

const worker = new Worker(
    'mail',
    async (job) => {
        const { type, payload } = job.data;

        switch (type) {
            case 'VERIFY_EMAIL':
                return mailService.sendVerificationEmail(payload.user, payload.verificationLink);

            case 'GREETING_EMAIL':
                return mailService.sendGreetingEmail(payload.user);

            case 'CHANGE_PASSWORD_EMAIL':
                return mailService.sendChangePasswordEmail(payload.user);

            case 'FORGOT_PASSWORD_OTP':
                return mailService.sendForgotPasswordOtpEmail(payload.user, payload.otp);

            default:
                throw new Error(`Unknown job type: ${type}`);
        }
    },
    {
        connection,
        concurrency: 5
    }
);

worker.on('ready', () => {
    console.log('Mail Worker Ready');
});

worker.on('completed', (job) => {
    console.log(`Mail Job Completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
    console.error(`Mail Job Failed: ${job?.id}`, err.message);
});
