import { ConsoleLogger, Controller, Get } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Delete, Param, Query } from '@nestjs/common/decorators';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { DeleteSessionsCommand } from 'src/application/commands/DeleteSessionCommand';
import { RealIP } from 'nestjs-real-ip';
import { ProcessClientAddressCommand } from 'src/application/commands/ProcessClientAddressCommand';
import { FindPlayerQuery } from 'src/application/queries/FindPlayerQuery';
import Player from 'src/domain/aggregates/Player';
import { UpdatePlayerCommand } from 'src/application/commands/UpdatePlayerCommand';
import SessionId from 'src/domain/value-objects/SessionId';
import TitleId from 'src/domain/value-objects/TitleId';

@ApiTags('XNet')
@Controller()
export class XNetController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext(XNetController.name);
  }

  @Get('/whoami')
  async getClientAddress(@RealIP() ip: string) {
    const ipv4 = await this.commandBus.execute(
      new ProcessClientAddressCommand(ip),
    );

    return { address: ipv4 };
  }

  @Delete(['/DeleteSessions/:macAddress', '/DeleteSessions'])
  @ApiQuery({ name: 'hostAddress', description: 'IP Address', required: false })
  @ApiParam({ name: 'macAddress', description: 'Mac Address', required: false })
  async deleteAllSessions(
    @RealIP() ip: string,
    @Query('hostAddress') hostAddress?: string,
    @Param('macAddress') macAddress?: string,
  ) {
    let ipv4 = hostAddress ? hostAddress : ip;

    ipv4 = await this.commandBus.execute(new ProcessClientAddressCommand(ipv4));

    let mac: MacAddress = null;

    try {
      mac = new MacAddress(macAddress);
    } catch {
      this.logger.debug('Deleting session(s) based on IP!');
    }

    await this.commandBus.execute(
      new DeleteSessionsCommand(new IpAddress(ipv4), mac),
    );

    const player: Player = await this.queryBus.execute(
      new FindPlayerQuery(new IpAddress(ipv4)),
    );

    if (player) {
      player.setSession(new SessionId('0'.repeat(16)));
      player.setTitleId(new TitleId('0'));
      player.setRichPresence('');

      await this.commandBus.execute(
        new UpdatePlayerCommand(player.xuid, player),
      );
    }
  }
}
