import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as express from 'express';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { verifyUploadSignature } from './common/security/file-signing';

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  // In development, do not rate-limit requests so testing and fast page reloads never get blocked
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const now = Date.now();
  const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const isCredentialAction = /^\/auth\/(login|forgot-password|verify-otp|reset-password)$/.test(req.path);
  const isSessionAction = /^\/auth\/(google|refresh)/.test(req.path);
  const isContactAction = req.path === '/contact/send';
  const isSensitive = isCredentialAction || isSessionAction || isContactAction;
  const windowMs = isSensitive ? 15 * 60 * 1000 : 60 * 1000;
  const max = isCredentialAction ? 10 : isContactAction ? 20 : isSessionAction ? 120 : 600;
  const identity = String(
    req.body?.username
      || req.body?.identifier
      || req.body?.resetSessionId
      || 'anonymous',
  ).trim().toLowerCase().slice(0, 160);
  const key = `${isCredentialAction ? `credential:${identity}` : isContactAction ? 'contact' : isSessionAction ? 'session' : 'api'}:${ip}`;
  const current = rateBuckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  rateBuckets.set(key, bucket);

  if (bucket.count > max) {
    res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({ statusCode: 429, message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
  }

  // Prevent unbounded growth in a single-process instance.
  if (rateBuckets.size > 10000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  return next();
}

async function bootstrap() {
  // Trigger config reload for updated .env
  const app = await NestFactory.create(AppModule);
  const httpServer = app.getHttpAdapter().getInstance();
  httpServer.set('trust proxy', 1);
  httpServer.disable('x-powered-by');

  // Document/AI import sends extracted text and (for PDF) inline image data
  // in the follow-up JSON request. Express' default ~100 KB parser limit
  // rejects legitimate 5–10 MB source files before the controller can
  // validate them, which surfaced in the UI as a generic import failure.
  // Keep multipart upload limits in the QuestionsController; this only raises
  // the JSON envelope limit for the extraction/generation contract.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(rateLimit);
  app.use((req, res, next) => {
    res.setHeader('X-Request-Id', req.header('X-Request-Id') || randomUUID());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
    res.setHeader('X-Frame-Options', 'DENY');
    if (req.headers.authorization || req.path.startsWith('/auth') || req.path.startsWith('/online-exams') || req.path.startsWith('/essay')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use('/uploads', (req, res, next) => {
    const uploadPath = `/uploads${req.path}`;
    if (!verifyUploadSignature(uploadPath, String(req.query.exp || ''), String(req.query.sig || ''))) {
      return res.status(401).json({ statusCode: 401, message: 'File URL không hợp lệ hoặc đã hết hạn.' });
    }
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'none'; script-src 'none'");
    return next();
  });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads'), { dotfiles: 'deny', index: false }));

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend server running on http://localhost:${port}`);
}
bootstrap();
