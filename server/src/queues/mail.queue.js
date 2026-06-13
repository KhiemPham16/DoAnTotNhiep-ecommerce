const { Queue } = require('bullmq');

const connection = require('./redis.connection');

const mailQueue = new Queue('mail', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

module.exports = mailQueue;
