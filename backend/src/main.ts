import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validateEnv } from './common/validation/env.validation';

async function bootstrap() {
  // Validate environment variables before starting (fail fast)
  const envCheck = validateEnv();
  if (!envCheck.valid && process.env.NODE_ENV === 'production') {
    console.error('Environment validation failed. Server will not start in production.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Stripe webhooks need the RAW request body to verify the signature — mount a raw
  // parser on the billing webhook path BEFORE the global JSON parser below, or the
  // body is consumed/reshaped and signature verification fails.
  app.use('/api/v1/billing/webhook', express.raw({ type: '*/*' }));

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

  // Response compression for JSON/API responses
  app.use(compression());

  // Security headers (Helmet) — must be after CORS, before routes
  app.use(helmet({
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
    crossOriginEmbedderPolicy: false, // Allow embedded images/videos from S3
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

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

  // Reverse proxy /uploads/<key> → MinIO so the browser can fetch with a same-origin URL.
  // Static-disk uploads above are checked first (legacy). Anything else falls through here.
  try {
    const { createProxyMiddleware } = await import('http-proxy-middleware');
    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const s3Bucket = process.env.S3_BUCKET || 'etunisia';
    app.use(
      '/uploads',
      createProxyMiddleware({
        target: s3Endpoint,
        changeOrigin: true,
        pathRewrite: (path) => `/${s3Bucket}${path}`,
      } as any),
    );
  } catch (e: any) {
    console.warn('Could not mount /uploads → MinIO proxy:', e?.message);
  }

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
  const swaggerPath = 'api/docs';

  // In production, protect Swagger docs with a simple query key or disable entirely
  const isProd = process.env.NODE_ENV === 'production';
  const swaggerEnabled = !isProd || process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    if (isProd && process.env.SWAGGER_SECRET) {
      // Production: require secret query parameter
      app.use(`/${swaggerPath}`, (req: any, res: any, next: any) => {
        if (req.query.secret !== process.env.SWAGGER_SECRET) {
          return res.status(403).send('Swagger docs are protected in production');
        }
        next();
      });
    }
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Enable graceful shutdown hooks for SIGTERM/SIGINT
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  const server = await app.listen(port);

  // Set server timeout to prevent hanging connections
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // Slightly higher than ALB default (60s)
  console.log(`🇹🇳 e-Tunisia API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`❤️ Health check: http://localhost:${port}/health`);
  console.log(`❤️ Queue health: http://localhost:${port}/health/queues`);
  console.log(`❤️ Redis health: http://localhost:${port}/health/redis`);

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed.');
    });
    // Give existing requests 10s to finish, then force close
    setTimeout(() => {
      console.error('Forced shutdown: timeout exceeded');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // One-shot backfills — only run in dev or when explicitly enabled
  const runBackfills = process.env.NODE_ENV === 'development' || process.env.RUN_BACKFILLS === 'true';
  if (runBackfills) {
    // Handle backfill (idempotent — safe to leave in place; runs <50ms on empty result).
    try {
      const { DataSource } = await import('typeorm');
      const ds = app.get(DataSource);
      const { backfillHandles } = await import('./users/backfill-handles');
      const { User } = await import('./users/user.entity');
      const n = await backfillHandles(ds.getRepository(User));
      if (n > 0) console.log(`[backfill] assigned handle to ${n} legacy users`);
    } catch (e) {
      console.warn('[backfill] handle backfill skipped:', (e as Error).message);
    }

    // Place visits backfill from legacy visitedPlaceIds (idempotent; no-op once populated).
    try {
      const { DataSource } = await import('typeorm');
      const ds = app.get(DataSource);
      const { backfillPlaceVisits } = await import('./users/backfill-place-visits');
      const n = await backfillPlaceVisits(ds);
      if (n > 0) console.log(`[backfill] seeded ${n} place_visits from legacy visited lists`);
    } catch (e) {
      console.warn('[backfill] place_visits backfill skipped:', (e as Error).message);
    }
  }
}
bootstrap();
