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
import { GetPlayerPresence, PlayerPresence } from '../responses/PlayerPresence';
import { PresenceRequest } from '../requests/PresenceRequest';
import Player from 'src/domain/aggregates/Player';
import { GetPlayersQuery } from 'src/application/queries/GetPlayersQuery';
import _ from 'lodash';

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
        new Xuid(request.machineId),
        new IpAddress(request.hostAddress),
        new MacAddress(request.macAddress),
        request.gamertag ? new Gamertag(request.gamertag) : undefined,
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
      gamertag: player.gamertag,
      hostAddress: player.hostAddress.value,
      machineId: player.machineId.value,
      port: player.port,
      macAddress: player.macAddress.value,
      sessionId: player.sessionId.value,
    };
  }

  @Post('/presence')
  async Presence(@Body() request: PresenceRequest): Promise<GetPlayerPresence> {
    const playerPresences: GetPlayerPresence = [];

    this.logger.debug(request);

    let xuids: Array<Xuid> = request.xuids.map((xuid: string) => {
      let xuid_: Xuid = undefined;

      try {
        xuid_ = new Xuid(xuid);
      } catch (error) {
        this.logger.error(`Invalid XUID: ${xuid}`);
      }

      return xuid_;
    });

    // Remove undefined xuids from array
    xuids = _.compact(xuids);

    const players: Array<Player> = await this.queryBus.execute(
      new GetPlayersQuery(xuids),
    );

    players.forEach((player: Player) => {
      const presence: PlayerPresence = {
        xuid: player.xuid.value,
        gamertag: player.gamertag.value,
        state: player.state.value,
        sessionId: player.sessionId.value,
        titleId: player.titleId.toString(),
        stateChangeTime: 0,
        richPresenceStateSize: 0,
        richPresence: 'Playing on Xenia',
      };

      playerPresences.push(presence);
    });

    return playerPresences;
  }
}
