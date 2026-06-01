"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const express = require("express");
const path_1 = require("path");
const helmet_1 = require("helmet");
const compression = require("compression");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const env_validation_1 = require("./common/validation/env.validation");
async function bootstrap() {
    const envCheck = (0, env_validation_1.validateEnv)();
    if (!envCheck.valid && process.env.NODE_ENV === 'production') {
        console.error('Environment validation failed. Server will not start in production.');
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use('/api/v1/billing/webhook', express.raw({ type: '*/*' }));
    app.use(express.json({ limit: '12mb' }));
    app.use(express.urlencoded({ limit: '12mb', extended: true }));
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
        prefix: 'api/v',
    });
    const allowedPatterns = (process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173',
        'https://*.vercel.app',
        'https://*.ngrok-free.app',
        'https://*.ngrok.app',
        'https://*.ngrok.io',
    ]).filter(Boolean);
    const originRegexes = allowedPatterns.map(pattern => {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        return new RegExp(`^${escaped}$`);
    });
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || originRegexes.some(r => r.test(origin))) {
                callback(null, true);
            }
            else {
                callback(new Error(`Not allowed by CORS: ${origin}`), false);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With,X-Pinggy-No-Landing-Page,ngrok-skip-browser-warning',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.use(compression());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                mediaSrc: ["'self'", "https:", "blob:"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
                connectSrc: ["'self'", "https:", "wss:"],
                frameSrc: ["'self'", "https://accounts.google.com"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor(), new logging_interceptor_1.LoggingInterceptor());
    app.use('/uploads', express.static((0, path_1.join)(__dirname, '..', 'uploads')));
    try {
        const { createProxyMiddleware } = await Promise.resolve().then(() => require('http-proxy-middleware'));
        const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
        const s3Bucket = process.env.S3_BUCKET || 'etunisia';
        app.use('/uploads', createProxyMiddleware({
            target: s3Endpoint,
            changeOrigin: true,
            pathRewrite: (path) => `/${s3Bucket}${path}`,
        }));
    }
    catch (e) {
        console.warn('Could not mount /uploads → MinIO proxy:', e?.message);
    }
    const config = new swagger_1.DocumentBuilder()
        .setTitle('e-Tunisia API')
        .setDescription('The ultimate platform for discovering Tunisia — culture, cuisine, nature & hidden gems. Expedia + Reddit + TikTok combined.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
    }, 'JWT')
        .addTag('auth', 'Authentication & authorization')
        .addTag('users', 'User management & profiles')
        .addTag('places', 'Places, destinations & hidden gems')
        .addTag('categories', 'Place categories')
        .addTag('reviews', 'Reviews & ratings')
        .addTag('media', 'File uploads & storage')
        .addTag('subscriptions', 'Premium plans & billing')
        .addTag('tips', 'Travel tips & guides')
        .addTag('events', 'Events & activities')
        .addTag('itineraries', 'Curated trip itineraries')
        .addTag('collections', 'Themed place collections')
        .addTag('admin', 'Admin dashboard endpoints')
        .addTag('sponsors', 'Sponsor management')
        .addTag('ads', 'Advertising platform')
        .addTag('gamification', 'XP, badges & leaderboards')
        .addTag('notifications', 'User notifications')
        .addTag('contact', 'Contact & partnership forms')
        .addTag('health', 'System health checks')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const swaggerPath = 'api/docs';
    const isProd = process.env.NODE_ENV === 'production';
    const swaggerEnabled = !isProd || process.env.SWAGGER_ENABLED === 'true';
    if (swaggerEnabled) {
        if (isProd && process.env.SWAGGER_SECRET) {
            app.use(`/${swaggerPath}`, (req, res, next) => {
                if (req.query.secret !== process.env.SWAGGER_SECRET) {
                    return res.status(403).send('Swagger docs are protected in production');
                }
                next();
            });
        }
        swagger_1.SwaggerModule.setup(swaggerPath, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
            },
        });
    }
    app.enableShutdownHooks();
    const port = process.env.PORT || 3000;
    const server = await app.listen(port);
    server.timeout = 30000;
    server.keepAliveTimeout = 65000;
    console.log(`🇹🇳 e-Tunisia API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
    console.log(`❤️ Health check: http://localhost:${port}/health`);
    console.log(`❤️ Queue health: http://localhost:${port}/health/queues`);
    console.log(`❤️ Redis health: http://localhost:${port}/health/redis`);
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        server.close(() => {
            console.log('HTTP server closed.');
        });
        setTimeout(() => {
            console.error('Forced shutdown: timeout exceeded');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    const runBackfills = process.env.NODE_ENV === 'development' || process.env.RUN_BACKFILLS === 'true';
    if (runBackfills) {
        try {
            const { DataSource } = await Promise.resolve().then(() => require('typeorm'));
            const ds = app.get(DataSource);
            const { backfillHandles } = await Promise.resolve().then(() => require('./users/backfill-handles'));
            const { User } = await Promise.resolve().then(() => require('./users/user.entity'));
            const n = await backfillHandles(ds.getRepository(User));
            if (n > 0)
                console.log(`[backfill] assigned handle to ${n} legacy users`);
        }
        catch (e) {
            console.warn('[backfill] handle backfill skipped:', e.message);
        }
        try {
            const { DataSource } = await Promise.resolve().then(() => require('typeorm'));
            const ds = app.get(DataSource);
            const { backfillPlaceVisits } = await Promise.resolve().then(() => require('./users/backfill-place-visits'));
            const n = await backfillPlaceVisits(ds);
            if (n > 0)
                console.log(`[backfill] seeded ${n} place_visits from legacy visited lists`);
        }
        catch (e) {
            console.warn('[backfill] place_visits backfill skipped:', e.message);
        }
    }
}
bootstrap();
//# sourceMappingURL=main.js.map