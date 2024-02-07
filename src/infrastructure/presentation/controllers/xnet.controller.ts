import { Controller, Get, Req, Inject, Post } from '@nestjs/common';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Delete, Param, Query } from '@nestjs/common/decorators';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { DeleteSessionsCommand } from 'src/application/commands/DeleteSessionCommand';
import { RealIP } from 'nestjs-real-ip';
import { ProcessClientAddressCommand } from 'src/application/commands/ProcessClientAddressCommand';

@ApiTags('XNet')
@Controller()
export class XNetController {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/whoami')
  async getClientAddress(@RealIP() ip: string) {
    const ipv4 = await this.commandBus.execute(
      new ProcessClientAddressCommand(ip),
    );

    return { address: ipv4 };
  }

  @Delete(['/DeleteSessions/:macAddress', '/DeleteSessions'])
  @ApiQuery({ name: 'hostAddress', description: 'IP Address' })
  @ApiParam({ name: 'macAddress', description: 'Mac Address' })
  async deleteAllSessions(
    @RealIP() ip: string,
    @Query('hostAddress') hostAddress?: string,
    @Param('macAddress') macAddress?: string,
  ) {
    let ipv4 = hostAddress ? hostAddress : ip;

    ipv4 = await this.commandBus.execute(new ProcessClientAddressCommand(ipv4));

    let mac = null;

    try {
      mac = new MacAddress(macAddress);
    } catch (err: unknown) {
      console.log('Deleting session(s) based on IP!');
    }

    await this.commandBus.execute(
      new DeleteSessionsCommand(new IpAddress(ipv4), mac),
    );
  }
}
