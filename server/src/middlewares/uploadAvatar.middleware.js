const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '../../uploads/avatars');

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
    destination(_req, _file, cb) {
        cb(null, uploadRoot);
    },
    filename(_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const safe = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
        cb(null, `${crypto.randomBytes(16).toString('hex')}${safe}`);
    }
});

const uploadAvatar = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
            cb(new Error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP'));
            return;
        }
        cb(null, true);
    }
});

module.exports = { uploadAvatar, uploadRoot };
