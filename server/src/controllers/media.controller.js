const mediaService = require('~/services/media.service');

class MediaController {
    async upload(req, res, next) {
        try {
            const media = await mediaService.uploadMedia(req.user.id, req.file, req.body);

            return res.status(201).json({
                success: true,
                message: 'Upload media thành công',
                data: media
            });
        } catch (error) {
            next(error);
        }
    }

    async index(req, res, next) {
        try {
            const media = await mediaService.getMedia();

            return res.status(200).json({
                success: true,
                data: media
            });
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const media = await mediaService.getMediaById(req.params.id);

            return res.status(200).json({
                success: true,
                data: media
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const media = await mediaService.updateMedia(req.params.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật media thành công',
                data: media
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await mediaService.deleteMedia(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa media thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MediaController();
