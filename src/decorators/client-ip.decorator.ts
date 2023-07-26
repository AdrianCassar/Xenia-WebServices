import { createParamDecorator } from '@nestjs/common';
import * as requestIp from 'request-ip';

export const GetIPAddress = createParamDecorator((data, req) => {
    if (req.clientIp) return req.clientIp;
    return requestIp.getClientIp(req);
});
