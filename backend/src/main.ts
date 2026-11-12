import 'dotenv/config'; // tem de ser o primeiro import: carrega o .env antes de tudo
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { UPLOADS_DIR, getCorsOrigins, getJwtSecret, isSwaggerEnabled } from './config/env';

async function bootstrap() {
  // Falhar ao arrancar é melhor do que falhar no primeiro pedido
  getJwtSecret();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const swagger = isSwaggerEnabled();

  // Atrás de um proxy (Render, nginx) o IP real vem em X-Forwarded-For. Sem isto o limite de pedidos
  // contaria todos os utilizadores como um só. Só se activa por configuração, para não confiar no cabeçalho sem proxy.
  const proxies = Number(process.env.TRUST_PROXY ?? 0);
  if (proxies > 0) app.set('trust proxy', proxies);

  // O Swagger precisa de scripts inline, que o helmet bloqueia por defeito.
  app.use(helmet(swagger ? { contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } } : { crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const origins = getCorsOrigins();
  app.enableCors({ origin: origins.length > 0 ? origins : false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Fotografias de perfil (nomes aleatórios, tipo validado no upload)
  app.useStaticAssets(join(process.cwd(), UPLOADS_DIR), { prefix: '/uploads/', index: false });

  if (swagger) {
    const config = new DocumentBuilder()
      .setTitle('AvaliaProf API')
      .setDescription('API REST da plataforma de avaliação de professores.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
