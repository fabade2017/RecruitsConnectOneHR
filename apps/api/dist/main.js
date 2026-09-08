"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path = __importStar(require("path"));
// Load env for MSSQL (Node 20+ native)
try {
    process.loadEnvFile?.(path.resolve(__dirname, '../../../.env'));
}
catch { }
try {
    process.loadEnvFile?.(path.resolve(__dirname, '../../.env'));
}
catch { }
try {
    process.loadEnvFile?.(path.resolve(process.cwd(), '.env'));
}
catch { }
try {
    process.loadEnvFile?.(path.resolve(process.cwd(), '../../.env'));
}
catch { }
try {
    require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
}
catch { }
try {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}
catch { }
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
// @ts-ignore
const express = __importStar(require("express"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    // Body parser limit for face base64 (10mb) — must be before routes
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
    // Production hardening: trust proxy (for rate-limit behind nginx), CORS, security headers
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
    // Basic security headers (helmet-like without extra dep) — allow GPS/camera for attendance face + geolocation
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self)');
        if (process.env.NODE_ENV === 'production')
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
    });
    // Rate limiting — 100 req/min per IP (in-memory MVP, use Redis in scale)
    const rateMap = new Map();
    app.use((req, res, next) => {
        if (req.url.includes('/health'))
            return next();
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const now = Date.now();
        const windowMs = 60 * 1000;
        const max = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
        const entry = rateMap.get(ip);
        if (!entry || now > entry.reset) {
            rateMap.set(ip, { count: 1, reset: now + windowMs });
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
        for (const [k, v] of rateMap.entries())
            if (now > v.reset)
                rateMap.delete(k);
    }, 5 * 60 * 1000).unref();
    app.setGlobalPrefix('v1');
    const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean);
    app.enableCors({
        origin: corsOrigins && corsOrigins.length ? corsOrigins : true,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'Idempotency-Key'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    // Swagger only in non-production or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
        try {
            const config = new swagger_1.DocumentBuilder()
                .setTitle('OneHR API')
                .setDescription('RecruitConnect OneHR™ - Workforce Operating System (RBAC hardened)')
                .setVersion('1.0')
                .addBearerAuth()
                .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Organization-Id' }, 'tenant')
                .build();
            const document = swagger_1.SwaggerModule.createDocument(app, config);
            swagger_1.SwaggerModule.setup('api/docs', app, document);
            console.log('Swagger enabled at /api/docs');
        }
        catch (e) {
            console.warn('Swagger setup failed (non-blocking):', e.message);
        }
    }
    //const port = process.env.PORT_API ? parseInt(process.env.PORT_API, 10) : 3001;
    const port = parseInt(process.env.PORT || process.env.PORT_API || '3001', 10);
    await app.listen(port, '0.0.0.0');
    console.log(`OneHR API listening on http://localhost:${port}/v1 (env=${process.env.NODE_ENV || 'development'})`);
    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    for (const sig of signals) {
        process.on(sig, async () => {
            console.log(`Received ${sig}, shutting down...`);
            await app.close();
            process.exit(0);
        });
    }
}
bootstrap();
