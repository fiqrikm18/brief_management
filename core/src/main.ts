import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';

const DEFAULT_CORS_ORIGINS = 'http://localhost:5173';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGINS', DEFAULT_CORS_ORIGINS)
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Core API')
    .setDescription('Core backend API documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch((error: unknown) => {
  console.error('Application startup failed:', error);
  process.exitCode = 1;
});
