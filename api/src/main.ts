import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ── Trust proxy ────────────────────────────────────────────────────────────
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // ── Helmet (security headers) ──────────────────────────────────────────────
  // Esconde X-Powered-By, protege contra XSS, clickjacking, MIME sniffing
  // e força HTTPS em produção. Deve ficar antes do CORS.
  app.use(helmet());

  // ── CORS ───────────────────────────────────────────────────────────────────
  // SECURITY FIX: o fallback anterior (`origin: true` quando
  // ALLOWED_ORIGINS estava vazia) reflectia automaticamente qualquer
  // Origin recebida como permitida — combinado com credentials:true,
  // isto equivale a origin:'*' com credentials, exactamente o padrão
  // que nunca deve coexistir. Bastava a env var não estar definida
  // (erro de configuração de deploy, não um ataque) para o CORS abrir
  // por completo. Agora: em produção, a ausência de ALLOWED_ORIGINS
  // falha o arranque de forma visível em vez de abrir silenciosamente;
  // fora de produção, mantém-se um fallback permissivo apenas para
  // desenvolvimento local.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ALLOWED_ORIGINS não está definida em produção. Define a variável de ambiente antes de arrancar o servidor — nunca usar CORS aberto com credentials em produção.',
      );
    }
    console.warn(
      '⚠️  ALLOWED_ORIGINS não definida — CORS aberto apenas para desenvolvimento local.',
    );
  }

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
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── WebSocket ──────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Listen ─────────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Mestroo API → http://0.0.0.0:${port}/api`);
}

bootstrap();