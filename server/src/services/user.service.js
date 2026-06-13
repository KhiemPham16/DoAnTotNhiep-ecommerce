const bcrypt = require('bcrypt');

const prisma = require('~/libs/prisma');

const authConfig = require('~/configs/auth.config');

const { AppError } = require('~/errors/AppError');
const { generateUsername } = require('~/utils/generateUsername');
const { validateUpdateAvatarPayload, validateCreateUserPayload } = require('~/validators/user.validator');

class UserService {
    toPublicUser(user) {
        if (!user) return null;

        return {
            id: user.publicId,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            gender: user.gender,
            emailVerifiedAt: user.emailVerifiedAt,
            deletedAt: user.deletedAt,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    async getMe(userId) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        return this.toPublicUser(user);
    }

    async updateMe(userId, data) {
        const updateData = {};

        if (data.fullName !== undefined) {
            updateData.fullName = data.fullName;
        }

        if (data.phone !== undefined) {
            updateData.phone = data.phone;
        }

        if (data.gender !== undefined) {
            updateData.gender = data.gender;
        }

        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: updateData
        });

        return this.toPublicUser(user);
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

        return this.toPublicUser(user);
    }

    async getUsers() {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return users.map((user) => this.toPublicUser(user));
    }

    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: {
                publicId: userId
            }
        });

        if (!user || user.deletedAt) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        return this.toPublicUser(user);
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

        return this.toPublicUser(user);
    }

    async updateUser(userId, data) {
        const existedUser = await prisma.user.findUnique({
            where: {
                publicId: userId
            }
        });

        if (!existedUser || existedUser.deletedAt) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        const updateData = {};

        if (data.fullName !== undefined) {
            updateData.fullName = data.fullName;
        }

        if (data.phone !== undefined) {
            updateData.phone = data.phone;
        }

        if (data.gender !== undefined) {
            updateData.gender = data.gender;
        }

        if (data.avatarUrl !== undefined) {
            updateData.avatarUrl = data.avatarUrl;
        }

        if (data.role !== undefined) {
            updateData.role = data.role;
        }

        const user = await prisma.user.update({
            where: {
                id: existedUser.id
            },
            data: updateData
        });

        return this.toPublicUser(user);
    }

    async deleteUser(userId) {
        const existedUser = await prisma.user.findUnique({
            where: {
                publicId: userId
            }
        });

        if (!existedUser || existedUser.deletedAt) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        const user = await prisma.user.update({
            where: {
                id: existedUser.id
            },
            data: {
                deletedAt: new Date()
            }
        });

        return this.toPublicUser(user);
    }

    async deleteMe(userId) {
        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                deletedAt: new Date()
            }
        });

        return this.toPublicUser(user);
    }
}

module.exports = new UserService();
