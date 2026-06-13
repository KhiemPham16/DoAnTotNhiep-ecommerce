const userService = require('~/services/user.service');

class UserController {
    async me(req, res, next) {
        try {
            const user = await userService.getMe(req.user.id);

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async updateMe(req, res, next) {
        try {
            const user = await userService.updateMe(req.user.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async updateAvatar(req, res, next) {
        try {
            const user = await userService.updateAvatar(req.user.id, req.file);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật avatar thành công',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async index(req, res, next) {
        try {
            const users = await userService.getUsers();

            return res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const user = await userService.createUser(req.body);

            return res.status(201).json({
                success: true,
                message: 'Tạo người dùng thành công',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật người dùng thành công',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await userService.deleteUser(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa người dùng thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteMe(req, res, next) {
        try {
            await userService.deleteMe(req.user.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa tài khoản thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
