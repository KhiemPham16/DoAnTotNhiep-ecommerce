const fs = require('fs');
const path = require('path');

const prisma = require('~/libs/prisma');
const { AppError } = require('~/errors/AppError');
const { validateUploadMediaPayload } = require('~/validators/media.validator');

class MediaService {
    toPublicUser(user) {
        if (!user) return null;

        return {
            id: user.publicId,
            fullName: user.fullName,
            email: user.email
        };
    }

    toPublicMedia(media) {
        if (!media) return null;

        return {
            id: media.publicId,
            fileName: media.fileName,
            originalName: media.originalName,
            mimeType: media.mimeType,
            size: media.size,
            url: media.url,
            type: media.type,
            alt: media.alt,
            folder: media.folder,
            uploadedBy: this.toPublicUser(media.uploadedBy),
            createdAt: media.createdAt,
            updatedAt: media.updatedAt
        };
    }

    async uploadMedia(userId, file, data = {}) {
        validateUploadMediaPayload(file);

        const { alt, folder } = data;

        let type = 'DOCUMENT';

        if (file.mimetype.startsWith('image/')) {
            type = 'IMAGE';
        }

        if (file.mimetype.startsWith('video/')) {
            type = 'VIDEO';
        }

        const safeFolder = folder?.trim() || 'common';

        const media = await prisma.media.create({
            data: {
                fileName: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/media/${safeFolder}/${file.filename}`,
                type,
                alt,
                folder: safeFolder,
                uploadedById: userId
            },
            include: {
                uploadedBy: true
            }
        });

        return this.toPublicMedia(media);
    }

    async getMedia() {
        const mediaList = await prisma.media.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                uploadedBy: true
            }
        });

        return mediaList.map((media) => this.toPublicMedia(media));
    }

    async getMediaById(mediaId) {
        const media = await prisma.media.findUnique({
            where: {
                publicId: mediaId
            },
            include: {
                uploadedBy: true
            }
        });

        if (!media) {
            throw new AppError(404, 'Media không tồn tại');
        }

        return this.toPublicMedia(media);
    }

    async updateMedia(mediaId, data) {
        const media = await prisma.media.findUnique({
            where: {
                publicId: mediaId
            }
        });

        if (!media) {
            throw new AppError(404, 'Media không tồn tại');
        }

        const updateData = {};

        if (data.alt !== undefined) {
            updateData.alt = data.alt;
        }

        if (data.folder !== undefined) {
            updateData.folder = data.folder?.trim() || 'common';
        }

        const updatedMedia = await prisma.media.update({
            where: {
                id: media.id
            },
            data: updateData,
            include: {
                uploadedBy: true
            }
        });

        return this.toPublicMedia(updatedMedia);
    }

    async deleteMedia(mediaId) {
        const media = await prisma.media.findUnique({
            where: {
                publicId: mediaId
            }
        });

        if (!media) {
            throw new AppError(404, 'Media không tồn tại');
        }

        const filePath = path.join(process.cwd(), media.url.replace(/^\/+/, ''));

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.media.delete({
            where: {
                id: media.id
            }
        });

        return true;
    }
}

module.exports = new MediaService();
