const express = require('express');
const controller = require('~/controllers/aiAdvisor.controller');
const { aiAdvisorLimiter } = require('~/middlewares/aiRateLimit.middleware');

const router = express.Router();

router.post('/book', aiAdvisorLimiter, controller.advise);

module.exports = router;
