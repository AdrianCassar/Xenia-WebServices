import {
  Controller,
  Inject,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CreatePlayerCommand } from 'src/application/commands/CreatePlayerCommand';
import { CreatePlayerRequest } from '../requests/CreatePlayerRequest';
import Xuid from 'src/domain/value-objects/Xuid';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { FindPlayerRequest } from '../requests/FindPlayerRequest';
import { FindPlayerQuery } from 'src/application/queries/FindPlayerQuery';
import type { PlayerResponse } from 'src/infrastructure/presentation/responses/PlayerResponse';

// TODO
/* This entire controller is all placeholder.
  I haven't studied the xnet / player calls much and I am 
  just filling the gaps with something limited, inefficient and insecure. */

@ApiTags('Player')
@Controller('/players')
@Controller()
export class PlayerController {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async createPlayer(@Body() request: CreatePlayerRequest) {
    await this.commandBus.execute(
      new CreatePlayerCommand(
        new Xuid(request.xuid),
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
    console.log(request);
    const player = await this.queryBus.execute(
      new FindPlayerQuery(new IpAddress(request.hostAddress)),
    );

    if (!player) throw new NotFoundException('player not found');

    return {
      xuid: player.xuid.value,
      hostAddress: player.hostAddress.value,
      machineId: player.machineId.value,
      port: player.port,
      macAddress: player.macAddress.value,
      sessionId: player.sessionId ? player.sessionId.value : '0000000000000000',
    };
  }
}
