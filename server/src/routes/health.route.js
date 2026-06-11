const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.success(200, { uptime: process.uptime() }, { message: 'OK' });
});

module.exports = router;
