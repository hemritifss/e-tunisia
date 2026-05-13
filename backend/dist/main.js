"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const express = require("express");
const path_1 = require("path");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
        prefix: 'api/v',
    });
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With,X-Pinggy-No-Landing-Page',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor(), new logging_interceptor_1.LoggingInterceptor());
    app.use('/uploads', express.static((0, path_1.join)(__dirname, '..', 'uploads')));
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
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🇹🇳 e-Tunisia API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
    console.log(`❤️ Health check: http://localhost:${port}/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map