const authService = require('~/services/auth.service');
const authConfig = require('~/configs/auth.config');
const { parseExpiresInToMs } = require('~/utils/expiresIn');

class AuthController {
    async register(req, res, next) {
        try {
            const { fullName, email, password, phone } = req.body;

            await authService.register(fullName, email, password, phone);

            return res.status(201).json({
                message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req, res, next) {
        try {
            const { token } = req.query;

            await authService.verifyEmail(token);

            return res.status(200).json({
                message: 'Xác thực email thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password);

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: parseExpiresInToMs(authConfig.refreshTokenExpires)
            });

            return res.status(200).json({
                message: `Người dùng đã đăng nhập thành công!`,
                accessToken: result.accessToken
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            await authService.logout(refreshToken);

            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            });

            return res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            const result = await authService.refreshToken(refreshToken);

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;

            await authService.forgotPassword(email);

            return res.status(200).json({
                message: 'Nếu email hợp lệ, OTP đặt lại mật khẩu sẽ được gửi trong ít phút'
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword } = req.body;

            await authService.resetPassword(email, otp, newPassword);

            return res.status(200).json({
                message: 'Đặt lại mật khẩu thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword, confirmNewPassword } = req.body;

            await authService.changePassword(userId, currentPassword, newPassword, confirmNewPassword);

            return res.status(200).json({
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
