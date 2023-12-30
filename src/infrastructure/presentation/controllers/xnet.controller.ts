import {
  Controller,
  Get,
  Req,
  Inject,
  Post,
} from '@nestjs/common';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Delete, Param, Query } from '@nestjs/common/decorators';
import axios from 'axios';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { DeleteSessionsCommand } from 'src/application/commands/DeleteSessionCommand';
import { RealIP } from 'nestjs-real-ip';

@ApiTags('XNet')
@Controller()
export class XNetController {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) { }

  @Get('/whoami')
  async getClientAddress(@RealIP() ip: string) {
    const splitIp = ip.split(':');
    let ipv4 = splitIp[splitIp.length - 1];

    console.log("whoami was: " + ip);

    if (ipv4 == "127.0.0.1" || ipv4.startsWith("192.168") || ipv4.split(".")[0] == "10") {
      // Hi me! Who are you?
      const res = await axios.get("https://api.ipify.org/");
      ipv4 = res.data;
    }

    console.log("whoami now: " + ipv4);

    return { address: ipv4 };
  }

  @Delete(['/DeleteSessions/:macAddress', '/DeleteSessions'])
  @ApiQuery({ name: "hostAddress", description: "IP Address", required: false })
  @ApiParam({ name: "macAddress", description: "Mac Address", required: true })
  async deleteAllSessions(
    @RealIP() ip: string,
    @Query('hostAddress') hostAddress?: string,
    @Param('macAddress') macAddress?: string,
  ) {
    const splitIp = ip.split(':');
    let ipv4 = splitIp[splitIp.length - 1];

    if (hostAddress) {
      ipv4 = hostAddress;
    }

    if (ipv4 == "127.0.0.1" || ipv4.startsWith("192.168") || ipv4.split(".")[0] == "10") {
      console.log("Resolving local IP");

      // Hi me! Who are you?
      const res = await axios.get("https://api.ipify.org/");
      ipv4 = res.data;
    }

    let mac = null;

    try {
      mac = new MacAddress(macAddress);
    } catch (err: unknown) {
      console.log("Deleting sessions based on IP!");
    }

    await this.commandBus.execute(
      new DeleteSessionsCommand(new IpAddress(ipv4), mac),
    );
  }
}