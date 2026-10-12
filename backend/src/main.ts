import 'dotenv/config'; // tem de ser o primeiro import: carrega o .env antes de tudo
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  getCorsOrigins,
  getJwtSecret,
  getLocationSecret,
  isSwaggerEnabled,
} from './config/env';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

/**
 * Agrupa as rotas no Swagger pelo caminho: /reports -> "reports",
 * /admin/reports -> "admin/reports", /listings/:id/media -> "media".
 * Um @ApiTags posto à mão num controller tem prioridade.
 */
function tagByPath(document: OpenAPIObject) {
  for (const [path, item] of Object.entries(document.paths)) {
    const [first, second] = path.split('/').filter(Boolean);
    let tag = first ?? 'raiz';
    if (first === 'admin' && second) tag = `admin/${second}`;
    if (path.includes('/media')) tag = 'media';

    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (operation && !operation.tags?.length) {
        operation.tags = [tag];
      }
    }
  }
}

async function bootstrap() {
  // Falhar ao arrancar é melhor do que falhar no primeiro pedido
  getJwtSecret();
  getLocationSecret();

  const app = await NestFactory.create(AppModule);

  const swaggerEnabled = isSwaggerEnabled();

  // A página do Swagger precisa de scripts inline, que a política por defeito do helmet
  // bloqueia. Só se relaxa quando o Swagger está ligado (fora de produção).
  app.use(helmet(swaggerEnabled ? { contentSecurityPolicy: false } : {}));

  const origins = getCorsOrigins();
  app.enableCors({ origin: origins.length > 0 ? origins : false });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new IoAdapter(app));

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('GoHome API')
      .setDescription(
        'API REST do GoHome 1.1. As rotas /admin/* exigem papel de admin com o 2FA concluído.',
      )
      .setVersion('1.1')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    tagByPath(document);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();