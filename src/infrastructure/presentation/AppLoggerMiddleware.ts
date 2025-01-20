import { ConsoleLogger, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import ipaddr from 'ipaddr.js';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new ConsoleLogger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, secure, method, originalUrl, headers } = request;

    this.logger.setContext(secure ? 'HTTPS' : 'HTTP');

    // converts IPv4-mapped IPv6 addresses to their IPv4 counterparts
    const ip_ipv4 = ipaddr.process(ip);
    const userAgent = request.get('user-agent') || '';

    response.on('close', () => {
      const { statusCode } = response;

      const headers_JSON = JSON.stringify(headers);

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${userAgent} ${ip_ipv4.toString()} ${headers_JSON}`,
      );
    });

    next();
  }
}
