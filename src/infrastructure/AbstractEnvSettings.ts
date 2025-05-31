import { Injectable } from '@nestjs/common';

@Injectable()
export default abstract class AbstractEnvSettings<T> {
  protected getFullConfig(): any {
    return {
      presentation: {
        port: parseInt(process.env.API_PORT),
      },
      persistance: {
        mongoURI: process.env.MONGO_URI ? process.env.MONGO_URI : '',
        swagger_API: process.env.SWAGGER_API
          ? process.env.SWAGGER_API
          : 'false',
        SSL: process.env.SSL ? process.env.SSL : 'false',
        nginx: process.env.nginx ? process.env.nginx : 'false',
        heroku_nginx: process.env.heroku_nginx
          ? process.env.heroku_nginx
          : 'false',
        xstorage: process.env.xstorage ? process.env.xstorage : 'false',
        HEROKU_RELEASE_CREATED_AT: process.env.HEROKU_RELEASE_CREATED_AT,
        HEROKU_BUILD_COMMIT: process.env.HEROKU_BUILD_COMMIT,
        START_TIME: new Date().toISOString(),
      },
    };
  }

  public abstract get(): T;
}
