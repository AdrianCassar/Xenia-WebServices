import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { XeniaModule } from './src/xenia.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import PresentationSettings from 'src/infrastructure/presentation/settings/PresentationSettings';
import PersistanceSettings from 'src/infrastructure/persistance/settings/PersistanceSettings';
import compression from 'compression';
import helmet from 'helmet';
import { ConsoleLogger } from '@nestjs/common';
import fs from 'fs';
import { json, urlencoded, raw, text } from 'express';

async function bootstrap() {
  const logger = new ConsoleLogger('Main');

  const envs = new PersistanceSettings().get();

  if (envs.mongoURI == '') {
    logger.error(`MONGO_URI is undefined!`);
  }

  const app = await NestFactory.create<NestExpressApplication>(XeniaModule, {
    bodyParser: false,
  });

  app.use((req: any, res: any, next: any) => {
    const url: string = req.url || '';
    if (url.startsWith('/users/') || url.startsWith('/media/') || url.startsWith('/storage/')) {
      req.url = '/services' + req.url;
      req.originalUrl = '/services' + req.originalUrl;
    }
    next();
  });

  // NodeJS parser does not work with TitleStorage(PUT) so we MUST use our own.
  const rawBodyVerify = (req: any, res: any, buf: Buffer) => {req.rawBody = buf;};
  const jsonParser = json({ limit: '1mb', verify: rawBodyVerify });
  const urlencodedParser = urlencoded({ limit: '1mb', extended: true, verify: rawBodyVerify });
  const rawParser = raw({ limit: '1mb', type: '*/*', verify: rawBodyVerify });
  const textParser = text({ limit: '1mb', verify: rawBodyVerify });

  app.use((req: any, res: any, next: any) => {
    const url: string = req.url || '';
    if (url.startsWith('/services/users/') || url.startsWith('/services/media/') || url.startsWith('/services/storage/')) {
      return next();
    }
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('application/json')) {return jsonParser(req, res, next);}
    if (ct.includes('application/x-www-form-urlencoded')) {return urlencodedParser(req, res, next);}
    if (ct.includes('text/plain')) {return textParser(req, res, next);}
    return rawParser(req, res, next);
  });

  const SSL_enabled = envs.SSL == 'true';
  const Swagger_enabled = envs.swagger_API == 'true';
  const Heroku_Nginx_enabled = envs.heroku_nginx == 'true';
  const Nginx_enabled = envs.nginx == 'true';
  const XStorage_enabled = envs.xstorage == 'true';

  if (Swagger_enabled) {
    const config = new DocumentBuilder()
      .setTitle('Xenia Web API')
      .setDescription('')
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  app.enableCors();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo='",
          ],
          upgradeInsecureRequests: SSL_enabled ? [] : null,
        },
      },
    }),
  );
  app.use(compression());

  // Support Heroku
  const PORT = process.env.PORT || new PresentationSettings().get().port;

  if (Heroku_Nginx_enabled || Nginx_enabled) {
    // Trust the first proxy (express)
    app.set('trust proxy', true);
  }

  // Heroku + Nginx
  if (Heroku_Nginx_enabled) {
    // Listen to ngnix socket
    await app.listen('/tmp/nginx.socket');

    // Let Ngnix know we want to start serving from the proxy
    fs.openSync('/tmp/app-initialized', 'w');
  } else {
    // Listen on all network interfaces
    await app.listen(PORT, '0.0.0.0');
  }

  logger.debug(``);
  logger.debug(`Swagger API:\t ${Swagger_enabled ? 'Enabled' : 'Disabled'}`);
  logger.debug(`SSL:\t\t ${SSL_enabled ? 'Enabled' : 'Disabled'}`);
  logger.debug(`Nginx:\t\t ${Nginx_enabled ? 'Enabled' : 'Disabled'}`);
  logger.debug(
    `Heroku & Nginx:\t ${Heroku_Nginx_enabled ? 'Enabled' : 'Disabled'}`,
  );
  logger.debug(`XStorage:\t\t ${XStorage_enabled ? 'Enabled' : 'Disabled'}`);
  logger.debug(``);
  logger.debug(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
