require('dotenv').config();
require('module-alias/register');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const prisma = require('~/libs/prisma');
const { registerRoutes } = require('~/routes');
const { responseMiddleware } = require('~/middlewares/response.middleware');
const { errorHandler } = require('~/middlewares/errorHandler.middleware');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

async function bootstrap() {
    prisma.initPrisma();

    const app = express();
    const port = process.env.PORT || 3000;

    app.use(responseMiddleware);

    app.use(
        cors({
            origin: process.env.FRONTEND_URL,
            credentials: true
        })
    );

    app.use(helmet());
    app.use(
        helmet.crossOriginResourcePolicy({
            policy: 'cross-origin'
        })
    );

    const swaggerDocument = JSON.parse(fs.readFileSync('./src/swagger.json', 'utf8'));

    app.use(express.json());
    app.use(cookieParser());
    app.use(morgan('common'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

    registerRoutes(app);

    app.use(errorHandler);

    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
