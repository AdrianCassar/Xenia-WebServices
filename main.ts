import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { XeniaModule } from './src/xenia.module';
import * as requestIp from 'request-ip';
import PresentationSettings from 'src/infrastructure/presentation/settings/PresentationSettings';
import PersistanceSettings from 'src/infrastructure/persistance/settings/PersistanceSettings';

async function bootstrap() {
  const app = await NestFactory.create(XeniaModule, {
    rawBody: true,
  });

  if(new PersistanceSettings().get().swagger_API == "true") {
    const config = new DocumentBuilder()
      .setTitle('Xenia Web API')
      .setDescription('')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.enableCors();
  app.use(requestIp.mw());

  // Support Heroku
  const PORT = process.env.PORT || new PresentationSettings().get().port

  await app.listen(PORT, () => {
      console.log("Listening on port: " + PORT);
  });
}
bootstrap();
