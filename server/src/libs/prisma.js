const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

let client;

function initPrisma() {
    if (client) {
        return client;
    }
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required');
    }
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
    client = new PrismaClient({ adapter });
    return client;
}

function getClient() {
    if (!client) {
        throw new Error('Prisma chưa sẵn sàng. Gọi initPrisma() trong server.js trước.');
    }
    return client;
}

const prisma = new Proxy(
    {},
    {
        get(_, prop) {
            if (prop === 'initPrisma') {
                return initPrisma;
            }
            const c = getClient();
            const value = c[prop];
            return typeof value === 'function' ? value.bind(c) : value;
        }
    }
);

module.exports = prisma;
