import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ── Trust proxy ────────────────────────────────────────────────────────────
  // Obrigatório em Render/Railway/Heroku/qualquer reverse proxy.
  // Sem isto, req.ip é sempre o IP do proxy — o ThrottlerGuard usa req.ip
  // como chave do contador, logo sem esta linha todos os utilizadores
  // partilham o mesmo bucket e o rate limit nunca funciona correctamente.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // ── Global prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ── WebSocket ──────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Listen ─────────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ ServiApp API → http://0.0.0.0:${port}/api`);
}

bootstrap();