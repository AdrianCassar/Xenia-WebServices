import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { XeniaModule } from './src/xenia.module';
import PresentationSettings from 'src/infrastructure/presentation/settings/PresentationSettings';
import PersistanceSettings from 'src/infrastructure/persistance/settings/PersistanceSettings';
import { HttpExceptionFilter } from 'src/application/http-exception.filter';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(XeniaModule, {
    rawBody: true,
  });

  if (new PersistanceSettings().get().swagger_API == 'true') {
    const config = new DocumentBuilder()
      .setTitle('Xenia Web API')
      .setDescription('')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.enableCors();
  app.use(compression());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Support Heroku
  const PORT = process.env.PORT || new PresentationSettings().get().port;

  await app.listen(PORT);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
