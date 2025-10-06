import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://play.workadventure.localhost',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-User-Id']
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Auth server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(`📝 Discovery: http://localhost:${process.env.PORT || 3000}/.well-known/openid-configuration`);
}
bootstrap();
