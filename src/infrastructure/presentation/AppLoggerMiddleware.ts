import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import ipaddr from 'ipaddr.js';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const ip = ipaddr.process(request.ip);
    const { method } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('close', () => {
      const headers = JSON.stringify(request.headers);

      this.logger.log(
        `${method} ${request.originalUrl} ${response.statusCode} - ${userAgent} ${ip} ${headers}`,
      );
    });

    next();
  }
}
