import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar cookie-parser
  app.use(cookieParser());

  // Configurar CORS com suporte a cookies cross-domain
  const corsOrigins = [process.env.CORS_ORIGIN].filter(Boolean);

  // Em desenvolvimento, adicionar origens localhost
  if (process.env.NODE_ENV !== 'production') {
    corsOrigins.push('http://play.workadventure.localhost', 'http://auth.workadventure.localhost');
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-User-Id', 'Cookie']
  });

  const cookieDomain = process.env.COOKIE_DOMAIN || '.workadventure.localhost';

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Auth server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(`📝 Discovery: http://localhost:${process.env.PORT || 3000}/.well-known/openid-configuration`);
  console.log(`🍪 Cookie domain configured for: ${cookieDomain}`);
}
bootstrap();
