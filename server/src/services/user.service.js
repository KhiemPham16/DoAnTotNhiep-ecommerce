const bcrypt = require('bcrypt');

const prisma = require('~/libs/prisma');

const authConfig = require('~/configs/auth.config');

const { AppError } = require('~/errors/AppError');
const { generateUsername } = require('~/utils/generateUsername');
const { validateUpdateAvatarPayload, validateCreateUserPayload } = require('~/validators/user.validator');

class UserService {
    async getMe(userId) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        const {
            password,
            resetPasswordOtp,
            resetPasswordOtpExpiresAt,
            verificationToken,
            verificationTokenExpiresAt,
            ...safeUser
        } = user;

        return safeUser;
    }

    async updateMe(userId, data) {
        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                gender: data.gender
            }
        });

        const { password, ...safeUser } = user;

        return safeUser;
    }

    async updateAvatar(userId, file) {
        validateUpdateAvatarPayload(file);

        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                avatarUrl: `/uploads/avatars/${file.filename}`
            }
        });

        const { password, ...safeUser } = user;

        return safeUser;
    }

    async getUsers() {
        return prisma.user.findMany({
            where: {
                deletedAt: null
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                gender: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }

    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user || user.deletedAt) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        const { password, ...safeUser } = user;

        return safeUser;
    }

    async createUser(data) {
        const { fullName, email, password, phone, role } = data;

        validateCreateUserPayload(data);

        const duplicate = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }]
            }
        });

        if (duplicate) {
            throw new AppError(409, 'Email hoặc phone đã tồn tại');
        }

        const username = await generateUsername(fullName);

        const hashedPassword = await bcrypt.hash(password, authConfig.bcryptRounds);

        const user = await prisma.user.create({
            data: {
                username,
                fullName,
                email,
                password: hashedPassword,
                phone,
                role: role || 'CUSTOMER',
                emailVerifiedAt: new Date()
            }
        });

        const { password: _, ...safeUser } = user;

        return safeUser;
    }

    async updateUser(userId, data) {
        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                gender: data.gender,
                avatarUrl: data.avatarUrl,
                role: data.role
            }
        });

        const { password, ...safeUser } = user;

        return safeUser;
    }

    async deleteUser(userId) {
        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                deletedAt: new Date()
            }
        });

        const { password, ...safeUser } = user;

        return safeUser;
    }
}

module.exports = new UserService();
