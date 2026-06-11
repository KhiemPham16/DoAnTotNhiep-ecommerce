const express = require('express');

const router = express.Router();

const addressController = require('~/controllers/address.controller');

const { authenticate } = require('~/middlewares/authenticate.middleware');

router.use(authenticate);

router.get('/me', addressController.me);

router.put('/me', addressController.upsertMe);

module.exports = router;
