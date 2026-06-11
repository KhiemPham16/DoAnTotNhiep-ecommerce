const prisma = require('~/libs/prisma');

function removeVietnameseTones(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

async function generateUsername(fullName) {
    const cleaned = removeVietnameseTones(fullName)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '');

    const baseUsername = cleaned || `user${Date.now()}`;

    let username = baseUsername;
    let count = 1;

    while (
        await prisma.user.findUnique({
            where: {
                username
            }
        })
    ) {
        username = `${baseUsername}${count}`;
        count++;
    }

    return username;
}

module.exports = { generateUsername };
