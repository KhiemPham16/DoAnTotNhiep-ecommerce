const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = require('~/libs/prisma');

const mailService = require('~/services/mail.service');

const mailQueue = require('~/queues/mail.queue');

const authConfig = require('~/configs/auth.config');
const { dateAfterExpiresIn } = require('~/utils/expiresIn');
const { generateUsername } = require('~/utils/generateUsername');

const {
    validateToken,
    validateRegisterPayload,
    validateLoginPayload,
    validateRefreshToken,
    validateForgotPasswordPayload,
    validateResetPasswordPayload,
    validateChangePasswordPayload
} = require('~/validators/auth.validator');

const { AppError } = require('~/errors/AppError');
const appConfig = require('~/configs/app.config');

class AuthService {
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
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    generateVerificationLink(user) {
        return `${appConfig.frontendUrl}/verify-email?token=${user.verificationToken}`;
    }

    async verifyEmail(token) {
        validateToken(token);

        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            throw new AppError(400, 'Token không hợp lệ hoặc đã hết hạn');
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                emailVerifiedAt: new Date(),
                verificationToken: null,
                verificationTokenExpiresAt: null
            }
        });

        await mailQueue.add('send-greeting-email', {
            type: 'GREETING_EMAIL',
            payload: {
                user: updatedUser
            }
        });

        return true;
    }

    async register(fullName, email, password, phone) {
        validateRegisterPayload(fullName, email, password, phone);

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

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                username,
                fullName,
                email,
                password: hashedPassword,
                phone,
                verificationToken,
                verificationTokenExpiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
            }
        });

        try {
            const verificationLink = this.generateVerificationLink(user);

            await mailQueue.add('send-verification-email', {
                type: 'VERIFY_EMAIL',
                payload: {
                    user,
                    verificationLink
                }
            });

            return true;
        } catch (error) {
            await prisma.user.delete({
                where: {
                    id: user.id
                }
            });

            throw error;
        }
    }

    async login(email, password) {
        validateLoginPayload(email, password);

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            throw new AppError(401, 'Email hoặc password không chính xác');
        }

        if (!user.emailVerifiedAt) {
            throw new AppError(403, 'Vui lòng xác thực email trước khi đăng nhập');
        }

        if (user.deletedAt) {
            const restoreDeadline = new Date(user.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

            if (restoreDeadline < new Date()) {
                throw new AppError(403, 'Tài khoản đã bị xóa vĩnh viễn');
            }
        }

        const passwordCorrect = await bcrypt.compare(password, user.password);

        if (!passwordCorrect) {
            throw new AppError(401, 'Email hoặc password không chính xác');
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                deletedAt: null,
                lastLogin: new Date()
            }
        });

        const accessToken = jwt.sign(
            {
                userId: updatedUser.id,
                role: updatedUser.role
            },
            authConfig.accessJwtSecret,
            {
                expiresIn: authConfig.accessTokenExpires
            }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');

        await prisma.session.create({
            data: {
                userId: updatedUser.id,
                refreshToken,
                expiresAt: dateAfterExpiresIn(authConfig.refreshTokenExpires)
            }
        });

        return {
            accessToken,
            refreshToken
        };
    }

    async logout(refreshToken) {
        if (!refreshToken) {
            return;
        }

        await prisma.session.deleteMany({
            where: {
                refreshToken
            }
        });

        return true;
    }

    async refreshToken(refreshToken) {
        validateRefreshToken(refreshToken);

        const session = await prisma.session.findUnique({
            where: {
                refreshToken
            }
        });

        if (!session) {
            throw new AppError(403, 'Token không hợp lệ hoặc đã hết hạn');
        }

        if (session.expiresAt < new Date()) {
            await prisma.session.delete({
                where: {
                    id: session.id
                }
            });

            throw new AppError(403, 'Token đã hết hạn');
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.userId
            }
        });

        if (!user) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            authConfig.accessJwtSecret,
            {
                expiresIn: authConfig.accessTokenExpires
            }
        );

        return {
            accessToken
        };
    }

    async forgotPassword(email) {
        validateForgotPasswordPayload(email);

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            throw new AppError(404, 'Email không tồn tại');
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                resetPasswordOtp: otp,
                resetPasswordOtpExpiresAt: dateAfterExpiresIn('30m')
            }
        });

        try {
            await mailQueue.add('send-forgot-password-otp', {
                type: 'FORGOT_PASSWORD_OTP',
                payload: {
                    user: updatedUser,
                    otp
                }
            });
        } catch (error) {
            console.error('SEND FORGOT PASSWORD OTP EMAIL ERROR:', error);
            throw new AppError(500, 'Không gửi được email OTP, vui lòng thử lại');
        }

        return true;
    }

    async resetPassword(email, otp, newPassword) {
        validateResetPasswordPayload(email, otp, newPassword);

        const user = await prisma.user.findFirst({
            where: {
                email,
                resetPasswordOtp: otp,
                resetPasswordOtpExpiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            throw new AppError(400, 'OTP không hợp lệ hoặc đã hết hạn');
        }

        const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword,
                resetPasswordOtp: null,
                resetPasswordOtpExpiresAt: null
            }
        });

        await prisma.session.deleteMany({
            where: {
                userId: user.id
            }
        });

        await mailQueue.add('send-change-password-email', {
            type: 'CHANGE_PASSWORD_EMAIL',
            payload: {
                user: updatedUser
            }
        });

        return true;
    }

    async changePassword(userId, currentPassword, newPassword, confirmNewPassword) {
        validateChangePasswordPayload(currentPassword, newPassword, confirmNewPassword);

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        const passwordCorrect = await bcrypt.compare(currentPassword, user.password);

        if (!passwordCorrect) {
            throw new AppError(401, 'Mật khẩu hiện tại không chính xác');
        }

        const samePassword = await bcrypt.compare(newPassword, user.password);

        if (samePassword) {
            throw new AppError(400, 'Mật khẩu mới không được trùng mật khẩu cũ');
        }

        const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword
            }
        });

        await prisma.session.deleteMany({
            where: {
                userId: user.id
            }
        });

        await mailQueue.add('send-change-password-email', {
            type: 'CHANGE_PASSWORD_EMAIL',
            payload: {
                user: updatedUser
            }
        });

        return true;
    }
}

module.exports = new AuthService();
