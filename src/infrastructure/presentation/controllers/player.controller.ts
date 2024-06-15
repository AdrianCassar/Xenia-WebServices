import {
  Controller,
  Post,
  Body,
  NotFoundException,
  ConsoleLogger,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CreatePlayerCommand } from 'src/application/commands/CreatePlayerCommand';
import { CreatePlayerRequest } from '../requests/CreatePlayerRequest';
import Xuid from 'src/domain/value-objects/Xuid';
import Gamertag from 'src/domain/value-objects/Gamertag';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { FindPlayerRequest } from '../requests/FindPlayerRequest';
import { FindPlayerQuery } from 'src/application/queries/FindPlayerQuery';
import type { PlayerResponse } from 'src/infrastructure/presentation/responses/PlayerResponse';

@ApiTags('Player')
@Controller('/players')
@Controller()
export class PlayerController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext(PlayerController.name);
  }

  @Post()
  async createPlayer(@Body() request: CreatePlayerRequest) {
    // what if xuid or mac address fails?

    await this.commandBus.execute(
      new CreatePlayerCommand(
        new Xuid(request.xuid),
        new Gamertag(request.gamertag),
        new Xuid(request.machineId),
        new IpAddress(request.hostAddress),
        new MacAddress(request.macAddress),
      ),
    );
  }

  @Post('/find')
  async findPlayer(
    @Body() request: FindPlayerRequest,
  ): Promise<PlayerResponse> {
    this.logger.verbose('\n' + JSON.stringify(request, null, 2));

    const player = await this.queryBus.execute(
      new FindPlayerQuery(new IpAddress(request.hostAddress)),
    );

    if (!player) {
      throw new NotFoundException('Player not found.');
    }

    return {
      xuid: player.xuid.value,
      gamertag: player.gamertag.value,
      hostAddress: player.hostAddress.value,
      machineId: player.machineId.value,
      port: player.port,
      macAddress: player.macAddress.value,
      sessionId: player.sessionId ? player.sessionId.value : '0000000000000000',
    };
  }
}
