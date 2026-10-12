import 'dotenv/config'; // tem de ser o primeiro import: carrega o .env antes de tudo
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsOrigins, getJwtSecret, getLocationSecret } from './config/env';

async function bootstrap() {
  // Falhar ao arrancar é melhor do que falhar no primeiro pedido
  getJwtSecret();
  getLocationSecret();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const origins = getCorsOrigins();
  app.enableCors({ origin: origins.length > 0 ? origins : false });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();