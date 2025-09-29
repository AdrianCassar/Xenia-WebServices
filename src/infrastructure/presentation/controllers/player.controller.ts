import {
  Controller,
  Post,
  Body,
  NotFoundException,
  ConsoleLogger,
  Get,
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
import {
  GetPlayerPresence as GetPlayersPresence,
  PlayerPresence,
} from '../responses/PlayerPresence';
import { PresenceRequest } from '../requests/PresenceRequest';
import { PresencesUpdateRequest } from '../requests/PresenceUpdateRequest';
import Player from 'src/domain/aggregates/Player';
import { GetPlayersQuery } from 'src/application/queries/GetPlayersQuery';
import _ from 'lodash';
import { FindUserInfo, FindUsersInfo } from '../responses/FindUserInfo';
import { FindUsersInfoRequest } from '../requests/FindUsersInfoRequest';
import { GetPlayerQuery } from 'src/application/queries/GetPlayerQuery';
import { GetPlayerGamertagQuery } from 'src/application/queries/GetPlayerGamertagQuery';
import { ProcessClientAddressCommand } from 'src/application/commands/ProcessClientAddressCommand';
import { RealIP } from 'nestjs-real-ip';
import { DeleteMyProfilesQuery } from 'src/application/queries/DeleteMyProfilesQuery';
import { UpdatePlayerCommand } from 'src/application/commands/UpdatePlayerCommand';

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
    // this.logger.verbose('\n' + JSON.stringify(request, null, 2));

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

  // Set Players Presence
  @Post('/setpresence')
  async SetPresence(@Body() request: PresencesUpdateRequest) {
    for (const PresenceUpdate of request.presence) {
      const player: Player = await this.queryBus.execute(
        new GetPlayerQuery(new Xuid(PresenceUpdate.xuid)),
      );

      if (!player) {
        continue;
      }

      player.setRichPresence(PresenceUpdate.richPresence);

      await this.commandBus.execute(
        new UpdatePlayerCommand(player.xuid, player),
      );
    }
  }

  // Get Friends Presence
  @Post('/presence')
  async Presence(
    @Body() request: PresenceRequest,
  ): Promise<GetPlayersPresence> {
    const playerPresences: GetPlayersPresence = [];

    this.logger.debug(request);

    let xuids: Array<Xuid> = request.xuids.map((xuid: string) => {
      let xuid_: Xuid = undefined;

      try {
        xuid_ = new Xuid(xuid);
      } catch {
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
        richPresence: player.richPresence,
      };

      playerPresences.push(presence);
    });

    return playerPresences;
  }

  // Fill in the missing information given a xuid or gamertag
  @Post('/findusers')
  async FindUsers(
    @Body() request: FindUsersInfoRequest,
  ): Promise<FindUsersInfo> {
    const UsersInfo: FindUsersInfo = [];

    for (const UserInfo of request.UsersInfo) {
      const info: FindUserInfo = {
        xuid: UserInfo[0],
        gamertag: UserInfo[1],
      };

      let player: Player;

      if (info.xuid) {
        const xuid: Xuid = new Xuid(info.xuid);

        player = await this.queryBus.execute(new GetPlayerQuery(xuid));

        if (player && !info.gamertag) {
          info.gamertag = player.gamertag.value;
        }
      }

      if (info.gamertag) {
        const gamertag: Gamertag = new Gamertag(info.gamertag);

        player = await this.queryBus.execute(
          new GetPlayerGamertagQuery(gamertag),
        );

        if (player && !info.xuid) {
          info.xuid = player.xuid.value;
        }
      }

      UsersInfo.push(info);
    }

    return UsersInfo;
  }

  @Get('/deletemyprofiles')
  async DeleteAllMyProfiles(@RealIP() ip: string) {
    const ipv4: string = await this.commandBus.execute(
      new ProcessClientAddressCommand(ip),
    );

    const profiles: Player[] = await this.queryBus.execute(
      new DeleteMyProfilesQuery(new IpAddress(ipv4)),
    );

    const deleted_profiles: Array<[string, string]> = [];

    for (const profile of profiles) {
      deleted_profiles.push([profile.gamertag.value, profile.xuid.value]);
    }

    return deleted_profiles;
  }
}
