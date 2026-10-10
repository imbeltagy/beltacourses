import 'dotenv/config'; // MUST be first — storage.constants.ts reads process.env on import
import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // Default would be a bare 400 with an array of messages; this keeps the
      // `{ code, error, message }` contract for validation failures too.
      exceptionFactory: (errors: ValidationError[]) =>
        new AppException(
          ErrorCode.VALIDATION_FAILED,
          errors.flatMap((e) => Object.values(e.constraints ?? {})).join('; '),
        ),
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Courses API')
    .setDescription('HTTP API for the courses platform')
    .setVersion('0.0.1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'token' },
      'access-token',
    )
    .build();

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
