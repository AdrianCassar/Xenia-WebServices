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
import Player, { getUserSettingsTable } from 'src/domain/aggregates/Player';
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
import UserSetting, {
  DefaultGamerpic,
  XUserSetting,
} from 'src/domain/value-objects/UserSetting';
import { SettingsUpdateRequest } from '../requests/SettingsUpdateRequest';
import { Table } from 'console-table-printer';

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

    const user_settings = new Map<string, Array<UserSetting>>();

    if (request?.settings) {
      const settings_data = new Map<string, string[]>(
        Object.entries(request.settings),
      );

      for (const [title_id, base64_settings] of settings_data) {
        for (const base64 of base64_settings) {
          if (user_settings.has(title_id)) {
            user_settings.get(title_id).push(new UserSetting(base64));
          } else {
            user_settings.set(title_id, [new UserSetting(base64)]);
          }
        }
      }
    }

    const player: Player = await this.commandBus.execute(
      new CreatePlayerCommand(
        new Xuid(request.xuid),
        new Xuid(request.machineId),
        new IpAddress(request.hostAddress),
        new MacAddress(request.macAddress),
        request.gamertag ? new Gamertag(request.gamertag) : undefined,
        request.settings ? user_settings : undefined,
      ),
    );

    player.PrettyPrintUserSettingsTable();
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

  @Post('/setsettings')
  async SetSettings(@Body() request: SettingsUpdateRequest) {
    const settings = new Map<string, Map<string, Array<string>>>();

    if (Array.isArray(request.settings)) {
      for (const xuidsObj of request.settings) {
        const xuids = Object.keys(xuidsObj)[0];

        const titlesArray = xuidsObj[xuids];

        const titles = new Map<string, Array<string>>();

        if (Array.isArray(titlesArray)) {
          for (const titlesObj of titlesArray) {
            const titlesKey = Object.keys(titlesObj)[0];

            const settingsArray = titlesObj[titlesKey];

            if (Array.isArray(settingsArray)) {
              titles.set(titlesKey, settingsArray);
            }
          }
        }

        settings.set(xuids, titles);
      }
    }

    const xuids: Array<Xuid> = Array.from(settings.keys()).map(
      (xuid: string) => {
        return new Xuid(xuid);
      },
    );

    const players: Array<Player> = await this.queryBus.execute(
      new GetPlayersQuery(xuids),
    );

    for (const player of players) {
      const xuid = player.xuid;

      const user_settings = settings.get(xuid.value);

      player.updateSettings(user_settings);

      const updated_player: Player = await this.commandBus.execute(
        new UpdatePlayerCommand(player.xuid, player),
      );
    }
  }

  @Post('/getsettings')
  async GetSettings(@Body() request: SettingsUpdateRequest): Promise<string> {
    const settings = new Map<string, Map<string, Array<string>>>();

    if (Array.isArray(request.settings)) {
      for (const xuidsObj of request.settings) {
        const xuids = Object.keys(xuidsObj)[0];

        const titlesArray = xuidsObj[xuids];

        const titles = new Map<string, Array<string>>();

        if (Array.isArray(titlesArray)) {
          for (const titlesObj of titlesArray) {
            const titlesKey = Object.keys(titlesObj)[0];

            const settingIdsArray = titlesObj[titlesKey];

            if (Array.isArray(settingIdsArray)) {
              titles.set(titlesKey, settingIdsArray);
            }
          }
        }

        settings.set(xuids, titles);
      }
    }

    const users_settings = new Map<string, Map<string, Array<UserSetting>>>();

    const xuids: Xuid[] = settings
      .keys()
      .map((xuid) => new Xuid(xuid))
      .toArray();

    const players: Player[] = await this.queryBus.execute(
      new GetPlayersQuery(xuids),
    );

    for (const [xuid, titles] of settings) {
      const player: Player = players.find(
        (current_xuid) => current_xuid.xuid.value == xuid,
      );

      const title_settings = new Map<string, Array<UserSetting>>();

      for (const [title_id, setting_ids] of titles) {
        const user_settings = new Array<UserSetting>();

        for (const setting_id of setting_ids) {
          const settingId: XUserSetting = <XUserSetting>(
            Number(`0x${setting_id}`)
          );

          let user_setting: UserSetting;

          if (player) {
            user_setting = player.getSetting(title_id, settingId);
          } else {
            this.logger.error(`Unregistered profile: ${xuid}`);
          }

          // We must always provide a gamerpic otherwise game will constantly ask for one.
          if (!user_setting) {
            if (settingId == XUserSetting.XPROFILE_GAMERCARD_PICTURE_KEY) {
              user_setting = DefaultGamerpic;
            }
          }

          if (user_setting) {
            user_settings.push(user_setting);
          } else {
            this.logger.error(`Missing user setting ${setting_id}`);
          }
        }

        title_settings.set(title_id, user_settings);
      }

      users_settings.set(xuid, title_settings);
    }

    const users_settings_jsonObj = {
      settings: [...users_settings].map(([xuids, titleIds]) => ({
        [xuids]: [...titleIds].map(([title_id, settings]) => ({
          [title_id]: settings.map((setting) => setting.toString()),
        })),
      })),
    };

    const users_settings_json_string = JSON.stringify(
      users_settings_jsonObj,
      null,
      4,
    );

    const tables = new Array<Table>();

    users_settings.values().forEach((user) => {
      user.forEach((settings, title_id) => {
        const table: Table = getUserSettingsTable();

        table.table.title = `${title_id}`;

        settings.forEach((setting) => {
          table.addRow(
            {
              column1: setting.getFriendlyName(),
              column2: `${!setting.isTitleSpecific() ? 'Dashboard' : 'Title'}`,
              column3: `0x${setting.getIDHexString()}`,
              column4: `${setting.getTypeString()}`,
              column5: `${setting.getSizeFromType()}`,
              column6: setting.getParsedData(),
            },
            { color: `${!setting.isTitleSpecific() ? 'blue' : 'magenta'}` },
          );
        });

        tables.push(table);
      });
    });

    tables.forEach((table) => {
      table.printTable();
    });

    return users_settings_json_string;
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
