import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Story images are data URLs (base64). Bump body parser to 12MB so we don't 413.
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ limit: '12mb', extended: true }));

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // CORS — supports exact origins and wildcard subdomains (e.g. "https://*.vercel.app").
  // Configure via ALLOWED_ORIGINS=comma,separated,list — defaults cover local dev + Vercel + ngrok.
  const allowedPatterns = (
    process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'https://*.vercel.app',
      'https://*.ngrok-free.app',
      'https://*.ngrok.app',
      'https://*.ngrok.io',
    ]
  ).filter(Boolean);

  const originRegexes = allowedPatterns.map(pattern => {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || originRegexes.some(r => r.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type,Accept,Authorization,X-Requested-With,X-Pinggy-No-Landing-Page,ngrok-skip-browser-warning',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Static files (fallback for local uploads during migration)
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('e-Tunisia API')
    .setDescription(
      'The ultimate platform for discovering Tunisia — culture, cuisine, nature & hidden gems. Expedia + Reddit + TikTok combined.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT',
    )
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
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
