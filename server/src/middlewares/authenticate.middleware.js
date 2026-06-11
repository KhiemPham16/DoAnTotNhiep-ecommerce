const jwt = require('jsonwebtoken');

const prisma = require('~/libs/prisma');
const authConfig = require('~/configs/auth.config');

function requireAccessSecret() {
    if (!authConfig.accessJwtSecret) {
        throw new Error('Missing accessJwtSecret');
    }

    return authConfig.accessJwtSecret;
}

async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return res.error(401, 'Chưa đăng nhập');
        }

        const token = header.slice(7).trim();

        if (!token) {
            return res.error(401, 'Chưa đăng nhập');
        }

        let payload;

        try {
            payload = jwt.verify(token, requireAccessSecret());
        } catch {
            return res.error(401, 'Token không hợp lệ hoặc đã hết hạn');
        }

        if (!payload.userId) {
            return res.error(401, 'Token không hợp lệ');
        }

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId
            }
        });

        if (!user || user.deletedAt) {
            return res.error(401, 'Người dùng không tồn tại');
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { authenticate };