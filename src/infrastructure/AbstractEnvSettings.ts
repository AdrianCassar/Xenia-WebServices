import { Injectable } from '@nestjs/common';

@Injectable()
export default abstract class AbstractEnvSettings<T> {
  protected getFullConfig(): any {
    return {
      presentation: {
        port: parseInt(process.env.API_PORT),
      },
      persistance: {
        mongoURI: process.env.MONGO_URI,
        swagger_API: process.env.SWAGGER_API,
        SSL: process.env.SSL,
        nginx: process.env.nginx,
        heroku_nginx: process.env.heroku_nginx,
      },
    };
  }

  public abstract get(): T;
}
