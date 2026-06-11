const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '../../uploads/media');

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const folder = req.body.folder || 'common';

        const targetDir = path.join(uploadRoot, folder);

        fs.mkdirSync(targetDir, {
            recursive: true
        });

        cb(null, targetDir);
    },

    filename(_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();

        cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
    }
});

const uploadMedia = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = {
    uploadMedia,
    uploadRoot
};
