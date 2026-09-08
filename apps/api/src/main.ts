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
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean);
  app.enableCors({
    origin: corsOrigins && corsOrigins.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'Idempotency-Key'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Swagger only in non-production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
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
      console.log('Swagger enabled at /api/docs');
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
