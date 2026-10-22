import 'reflect-metadata';
import * as path from 'path';
// Load env for MSSQL (Node 20+ native)
try { (process as any).loadEnvFile?.(path.resolve(__dirname, '../../../.env')); } catch {}
try { (process as any).loadEnvFile?.(path.resolve(__dirname, '../../.env')); } catch {}
try { (process as any).loadEnvFile?.(path.resolve(process.cwd(), '.env')); } catch {}
try { (process as any).loadEnvFile?.(path.resolve(process.cwd(), '../../.env')); } catch {}
try { require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') }); } catch {}
try { require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); } catch {}
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
// @ts-ignore
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Body parser limit for face base64 (10mb) — must be before routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Production hardening: trust proxy (for rate-limit behind nginx), CORS, security headers
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Basic security headers (helmet-like without extra dep) — allow GPS/camera for attendance face + geolocation
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self)');
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Rate limiting — 100 req/min per IP (in-memory MVP, use Redis in scale)
  const rateMap = new Map<string, { count: number; reset: number }>();
  app.use((req: any, res: any, next: any) => {
    if (req.url.includes('/health')) return next();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const max = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
    const entry = rateMap.get(ip as string);
    if (!entry || now > entry.reset) {
      rateMap.set(ip as string, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ statusCode: 429, message: 'Too many requests' });
    }
    next();
  });

  // Clean up rateMap every 5 min
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of rateMap.entries()) if (now > v.reset) rateMap.delete(k);
  }, 5 * 60 * 1000).unref();

  app.setGlobalPrefix('v1');
  // Serve uploaded learning materials
  try {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    expressApp.use('/uploads', express.static(uploadsDir));
  } catch {}
  const parseOrigins = (v?: string) => (v || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  // Known product frontends — always allowed, in addition to CORS_ORIGIN.
  // Still an explicit allowlist, never origin:true.
  const productOrigins = [
    'https://www.rconehr.com',
    'https://rconehr.com',
    'https://recruits-connect-one-hr-web.vercel.app',
  ];
  // Local dev (npm run dev -> web :3000, api :3001)
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  const configuredOrigins = Array.from(new Set([
    ...parseOrigins(process.env.CORS_ORIGIN),
    ...parseOrigins(process.env.WEB_APP_URL),
  ]));
  const corsOrigins = Array.from(new Set([
    ...configuredOrigins,
    ...productOrigins,
    ...devOrigins,
  ]));
  if (!configuredOrigins.length) {
    console.error('[cors] CORS_ORIGIN not set — allowing the known product origins only: ' + productOrigins.join(', ') + '. Set CORS_ORIGIN explicitly on Render.');
  }
  console.log('[cors] allowed origins: ' + corsOrigins.join(', '));
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'Idempotency-Key'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Swagger — off by default in production; enable with ENABLE_SWAGGER=true
  const swaggerEnabled = process.env.ENABLE_SWAGGER === 'true' || (process.env.ENABLE_SWAGGER !== 'false' && process.env.NODE_ENV !== 'production');
  if (swaggerEnabled) {
    try {
      const config = new DocumentBuilder()
        .setTitle('OneHR API')
        .setDescription('RecruitConnect OneHR™ - Workforce Operating System (RBAC hardened)')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Organization-Id' }, 'tenant')
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      console.log(`Swagger enabled at /v1/api/docs (also /api/docs)`);
    } catch (e) {
      console.warn('Swagger setup failed (non-blocking):', (e as Error).message);
    }
  }

  //const port = process.env.PORT_API ? parseInt(process.env.PORT_API, 10) : 3001;
  const port = parseInt(process.env.PORT || process.env.PORT_API || '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`OneHR API listening on http://localhost:${port}/v1 (env=${process.env.NODE_ENV || 'development'})`);

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const sig of signals) {
    process.on(sig, async () => {
      console.log(`Received ${sig}, shutting down...`);
      await app.close();
      process.exit(0);
    });
  }
}
bootstrap();
