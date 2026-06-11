import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ─────────────────────────────────────────────────────────────────
  // Add your Vercel URLs here. Render sets PORT automatically.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ── WebSocket adapter ─────────────────────────────────────────────────────
  // IoAdapter works on Render's free tier (no sticky sessions needed for
  // single-instance deployments). If you scale to multiple instances later,
  // switch to @socket.io/redis-adapter.
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0'); // '0.0.0.0' required on Render
  console.log(`ServiApp API running on port ${port}`);
}

bootstrap();