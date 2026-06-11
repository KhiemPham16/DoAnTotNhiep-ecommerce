const fs = require('fs');
const path = require('path');

const { apiLimiter } = require('~/middlewares/rateLimit.middleware');

function registerRoutes(app) {
    const dir = __dirname;
    const files = fs.readdirSync(dir);
    app.use('/api/v1', apiLimiter);

    for (const file of files) {
        if (!file.endsWith('.route.js')) continue;

        const baseName = path.basename(file, '.route.js');
        const router = require(`~/routes/${baseName}.route`);

        app.use(`/api/v1/${baseName}`, router);
    }
}

module.exports = { registerRoutes };
