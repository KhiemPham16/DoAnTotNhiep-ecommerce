const fs = require('fs');
const path = require('path');

const prisma = require('~/libs/prisma');
const { AppError } = require('~/errors/AppError');
const { validateUploadMediaPayload } = require('~/validators/media.validator');

class MediaService {
    async uploadMedia(userId, file, data) {
        validateUploadMediaPayload(file);

        const { alt, folder } = data;

        let type = 'DOCUMENT';

        if (file.mimetype.startsWith('image/')) {
            type = 'IMAGE';
        }

        if (file.mimetype.startsWith('video/')) {
            type = 'VIDEO';
        }

        const safeFolder = folder || 'common';

        return prisma.media.create({
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
            }
        });
    }

    async getMedia() {
        return prisma.media.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });
    }

    async getMediaById(mediaId) {
        const media = await prisma.media.findUnique({
            where: {
                id: mediaId
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        if (!media) {
            throw new AppError(404, 'Media không tồn tại');
        }

        return media;
    }

    async updateMedia(mediaId, data) {
        const media = await prisma.media.findUnique({
            where: {
                id: mediaId
            }
        });

        if (!media) {
            throw new AppError(404, 'Media không tồn tại');
        }

        return prisma.media.update({
            where: {
                id: mediaId
            },
            data: {
                alt: data.alt,
                folder: data.folder
            }
        });
    }

    async deleteMedia(mediaId) {
        const media = await prisma.media.findUnique({
            where: {
                id: mediaId
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
                id: mediaId
            }
        });

        return true;
    }
}

module.exports = new MediaService();
