import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Robust CORS
    app.enableCors({
        origin: (origin, callback) => {
            console.log('🏁 Incoming CORS request from:', origin); 
            callback(null, true);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With,X-Pinggy-No-Landing-Page',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // Static files
    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('e-Tunisia API')
        .setDescription(
            'API for discovering Tunisia — culture, cuisine & nature',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth')
        .addTag('users')
        .addTag('places')
        .addTag('categories')
        .addTag('reviews')
        .addTag('subscriptions')
        .addTag('tips')
        .addTag('events')
        .addTag('itineraries')
        .addTag('collections')
        .addTag('admin')
        .addTag('sponsors')
        .addTag('ads')
        .addTag('gamification')
        .addTag('notifications')
        .addTag('contact')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🇹🇳 e-Tunisia API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();