import { ConsoleLogger, Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { AggregateSessionCommand } from '../commands/AggregateSessionCommand';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import axios, { AxiosRequestConfig, ResponseType } from 'axios';
import { AxiosResponse } from 'axios';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import Player from 'src/domain/aggregates/Player';
import Xuid from 'src/domain/value-objects/Xuid';
import XStringVerify from 'src/domain/XStringVerify';
import Session from 'src/domain/aggregates/Session';
import PersistenceSettings from 'src/infrastructure/persistence/settings/PersistenceSettings';
import UserSetting, {
  DashboardID,
  DefaultGamerpicKey,
  XUserSetting,
} from 'src/domain/value-objects/UserSetting';

const title_name_cache = new Map<string, string>();

const X360DB_URL = 'https://xenia-manager.github.io/x360db/titles';

const GAMERPICS_URL = 'https://assets.xboxgamer.pics/titles';

const config = new PersistenceSettings().get();

interface PlayerInfo {
  gamertag: string;
  gamerpic: string;
}

@CommandHandler(AggregateSessionCommand)
export class AggregateSessionCommandHandler implements ICommandHandler<AggregateSessionCommand> {
  constructor(
    @Inject(ISessionRepositorySymbol)
    private session_repository_: ISessionRepository,
    @Inject(IPlayerRepositorySymbol)
    private player_repository_: IPlayerRepository,
    private readonly logger: ConsoleLogger,
  ) {
    logger.setContext(AggregateSessionCommand.name);
  }

  async downloadContent(
    url: string,
    type: ResponseType,
    timeout?: number,
  ): Promise<any> {
    let axios_response: AxiosResponse<any, any> = undefined;

    const config: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      responseType: type,
      timeout: timeout,
    };

    await axios
      .request(config)
      .then((response) => {
        axios_response = response;
      })
      .catch((error) => {
        if (error.response) {
          this.logger.error(`Failed ${url}`);
        } else if (error.request) {
          this.logger.error(`Failed ${url}`);
        } else {
          this.logger.error(`Failed ${url}`);
        }

        this.logger.error(`${error.message}\n`);
      });

    return axios_response?.data;
  }

  async getTitleName(titleId: string): Promise<string> {
    if (title_name_cache.has(titleId)) {
      return title_name_cache.get(titleId);
    }

    const info = await this.downloadContent(
      `${X360DB_URL}/${titleId}/info.json`,
      'json',
      1000,
    );

    const title: string = info?.title?.full || info?.title?.reduced || '';

    // Don't cache empty response
    if (title) {
      title_name_cache.set(titleId, title);
    }

    return title;
  }

  getPlayerGamerpicIcon(gamerpic_key: string, small: boolean = false): string {
    const title_id = gamerpic_key.substring(0, 8).toLowerCase();
    const big_tile_id = gamerpic_key.substring(8, 16).replace(/^0+/, '');
    const small_tile_id = gamerpic_key.substring(16, 24).replace(/^0+/, '');

    const tile_id: string = small ? small_tile_id : big_tile_id;

    return `${GAMERPICS_URL}/${title_id}/${tile_id}.png`;
  }

  async getHostGamertag(session: Session): Promise<string> {
    if (session.HasProperties()) {
      const HostGamerNameProperty = session.propertyHostGamerName;

      if (HostGamerNameProperty) {
        const HostGamerName = HostGamerNameProperty.getUTF16();

        // Check for empty HostGamerName incase of base64 corruption
        if (HostGamerName && XStringVerify.Verify(HostGamerName)) {
          return HostGamerName;
        } else {
          return 'Player 1';
        }
      }
    }

    // Find via XUID in session
    for (const player_xuid of session.players.keys()) {
      const peer = await this.player_repository_.findByXuid(
        new Xuid(player_xuid),
      );

      if (!peer) {
        return 'Player 1';
      }

      const peer_gamertag = peer.gamertag.value;

      // Fallback for clients without properties support
      if (session.xuid?.value == peer.xuid.value) {
        if (XStringVerify.Verify(peer_gamertag)) {
          return peer_gamertag;
        }
      }
    }

    // Get first player in players map
    if (session.players.size > 0) {
      const xuid: string = session.players.keys().next().value;
      const peer = await this.player_repository_.findByXuid(new Xuid(xuid));

      if (!peer) {
        return 'Player 1';
      }

      const peer_gamertag = peer.gamertag.value;

      if (XStringVerify.Verify(peer_gamertag)) {
        return peer_gamertag;
      }
    }

    return 'Player 1';
  }

  async getHostPresenceString(session: Session): Promise<string> {
    const HOST_XUID: Xuid = session.getHostXUID;

    if (HOST_XUID) {
      const HOST: Player = await this.player_repository_.findByXuid(HOST_XUID);

      if (
        HOST &&
        XStringVerify.Verify(HOST.richPresence) &&
        HOST.richPresence
      ) {
        return HOST.richPresence;
      }
    }

    const title_id = session.titleId.toString();
    return `Playing ${await this.getTitleName(title_id)}`;
  }

  async execute() {
    const sessions = await this.session_repository_.findAllAdvertisedSessions();

    const HasMetaData = Boolean(
      config.HEROKU_RELEASE_CREATED_AT?.length ||
      config.HEROKU_BUILD_COMMIT?.length ||
      config.START_TIME?.length,
    );

    const Metadata = {
      HEROKU_RELEASE_CREATED_AT: config.HEROKU_RELEASE_CREATED_AT,
      HEROKU_BUILD_COMMIT: config.HEROKU_BUILD_COMMIT,
      START_TIME: config.START_TIME,
    };

    const titles = {};

    titles['Titles'] = [];

    if (HasMetaData) {
      titles['Metadata'] = Metadata;
    }

    // We don't want to display too many sessions on the frontend so just display 1 session from host with the most active player count.
    // This could probably be filtered on DB server side to be honest.
    // Since we do not enforce only one profile logon on the backend, technically multiple profile logins of different titles may not display correctly.
    const grouped_sessions = Object.groupBy(
      sessions,
      (session) => session.xuid.value,
    );

    const filtered_grouped_sessions = Object.values(grouped_sessions).flatMap(
      (session_group) => {
        // Find the most active session in this specific group
        const active_session = session_group.reduce(
          (active_session, less_active_session) => {
            if (
              active_session.players.size == less_active_session.players.size
            ) {
              return active_session;
            }

            if (
              active_session.players.size > less_active_session.players.size
            ) {
              return active_session;
            } else {
              return less_active_session;
            }
          },
        );

        return [active_session];
      },
    );

    for (const session of filtered_grouped_sessions) {
      const title_id = session.titleId.toString();

      let game_title: string = await this.getTitleName(title_id);

      // Fallback to title from session
      if (!game_title) {
        if (XStringVerify.Verify(session.title)) {
          game_title = session.title;
        }
      }

      const player_xuids: Xuid[] = [...session.players.keys()].map(
        (xuid) => new Xuid(xuid),
      );

      const players: Player[] =
        await this.player_repository_.findByXuids(player_xuids);

      const HOST_XUID: Xuid = session.getHostXUID;

      if (!HOST_XUID) {
        continue;
      }

      const host_player: Player = players.find(
        (player) => player.xuid.value === HOST_XUID.value,
      );

      if (!host_player) {
        continue;
      }

      const PlayersInfo = new Array<PlayerInfo>();

      const HOST_PRESENCE_STRING: string =
        await this.getHostPresenceString(session);
      const HOST_GAMERTAG: string = await this.getHostGamertag(session);
      const HOST_GAMERPIC_SETTING: UserSetting = host_player.getSetting(
        DashboardID,
        XUserSetting.XPROFILE_GAMERCARD_PICTURE_KEY,
      );

      const HOST_GAMERPIC_KEY: string = HOST_GAMERPIC_SETTING
        ? HOST_GAMERPIC_SETTING.getParsedData()
        : DefaultGamerpicKey;

      const host_info: PlayerInfo = {
        gamertag: HOST_GAMERTAG,
        gamerpic: this.getPlayerGamerpicIcon(HOST_GAMERPIC_KEY),
      };

      PlayersInfo.push(host_info);

      let defaulting_gamertags: number = 0;
      let local_defaulting_gamertags: number = 0;

      let players_count: number = 0;
      if (session.players.size > 1) {
        for (const player_xuid of session.players.keys()) {
          const peer_info: PlayerInfo = {
            gamertag: '',
            gamerpic: '',
          };

          players_count++;

          const peer: Player = players.find(
            (player) => player.xuid.value === player_xuid,
          );

          // Player is local if they're not registered
          if (!peer) {
            // Skip Defaulting Host
            if (session.players.size == 1) {
              continue;
            }

            local_defaulting_gamertags++;

            peer_info.gamertag = `Local Player ${local_defaulting_gamertags}`;
            peer_info.gamerpic = this.getPlayerGamerpicIcon(DefaultGamerpicKey);

            PlayersInfo.push(peer_info);

            continue;
          }

          const gamerpic_key_setting: UserSetting = peer.getSetting(
            DashboardID,
            XUserSetting.XPROFILE_GAMERCARD_PICTURE_KEY,
          );

          const gamerpic_key: string = gamerpic_key_setting
            ? gamerpic_key_setting.getParsedData()
            : DefaultGamerpicKey;

          peer_info.gamerpic = this.getPlayerGamerpicIcon(gamerpic_key);

          // Skip Host since they're already added to PlayerGamertags
          if (HOST_XUID) {
            if (HOST_XUID.value == peer.xuid.value) {
              continue;
            }
          } else if (players_count == 1) {
            // We can't get XUID so assume player 1 is host
            continue;
          }

          const peer_gamertag = peer.gamertag.value;

          // Peer Gamer
          if (XStringVerify.Verify(peer_gamertag)) {
            peer_info.gamertag = peer_gamertag;
          } else {
            defaulting_gamertags++;
            peer_info.gamertag = `Player ${defaulting_gamertags}`;
          }

          PlayersInfo.push(peer_info);
        }
      }

      let index = titles['Titles'].findIndex(
        (title: { titleId: string }) => title.titleId == title_id,
      );

      if (index == -1) {
        const data = {
          titleId: title_id,
          name: game_title,
          sessions: [],
        };

        titles['Titles'].push(data);

        index = titles['Titles'].length - 1;
      }

      const data = {
        mediaId: session.mediaId,
        version: session.version,
        players: PlayersInfo,
        total: session.totalSlots,
        host_presence: HOST_PRESENCE_STRING,
        host_gamertag: HOST_GAMERTAG,
        host_xuid: HOST_XUID?.value,
      };

      titles['Titles'][index]['sessions'].push(data);
    }

    this.logger.verbose(`Title Name Cache Count: ${title_name_cache.size}`);

    this.logger.verbose('Recent Games:');
    for (const title_name of title_name_cache.values()) {
      this.logger.verbose(title_name);
    }

    return JSON.stringify(titles);
  }
}
