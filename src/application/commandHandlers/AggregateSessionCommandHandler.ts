import { ConsoleLogger, Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { AggregateSessionCommand } from '../commands/AggregateSessionCommand';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import axios, { AxiosRequestConfig, ResponseType } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { AxiosResponse } from 'axios';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import Player from 'src/domain/aggregates/Player';
import Xuid from 'src/domain/value-objects/Xuid';
import XStringVerify from 'src/domain/XStringVerify';
import Session from 'src/domain/aggregates/Session';
import PersistanceSettings from 'src/infrastructure/persistance/settings/PersistanceSettings';

const icon_cache = new Map<string, string>();
const title_info_cache = new Map<string, object>();
const title_xml_cache = new Map<string, object>();

const config = new PersistanceSettings().get();

@CommandHandler(AggregateSessionCommand)
export class AggregateSessionCommandHandler
  implements ICommandHandler<AggregateSessionCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private session_repository_: ISessionRepository,
    @Inject(IPlayerRepositorySymbol)
    private player_repository_: IPlayerRepository,
    private readonly logger: ConsoleLogger,
  ) {
    logger.setContext(AggregateSessionCommand.name);
  }

  async downloadImageAsBase64(url: string): Promise<string> {
    const response: string = await this.downloadContent(url, 'arraybuffer');

    if (response) {
      const base64 = Buffer.from(response, 'binary').toString('base64');
      return `data:image/png;base64,${base64}`;
    }

    return '';
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

  async getTitleXML(titleId: string): Promise<object> {
    if (title_xml_cache.has(titleId)) {
      return title_xml_cache.get(titleId);
    }

    // URL, Timeout
    const backends: Array<[string, number]> = [];

    backends.push([`https://archive.rushhosting.net/api/xml/${titleId}`, 1000]);
    backends.push([
      `https://raw.githubusercontent.com/wildmaster84/restored-media/refs/heads/main/${titleId}/${titleId.toLowerCase()}.xml`,
      500,
    ]);
    backends.push([
      `https://marketplace-xb.xboxlive.com/marketplacecatalog/v1/product/en-US/66ACD000-77FE-1000-9115-D802${titleId}?bodytypes=1.3&detailview=detaillevel5&pagenum=1&pagesize=1&stores=1&tiers=2.3&offerfilter=1&producttypes=1.5.18.19.20.21.22.23.30.34.37.46.47.61`,
      1000,
    ]);

    let title_xml: string = '';
    let is_valid = true;

    let xml_document = undefined;

    for (const backend of backends) {
      const url: string = backend[0];
      const timeout: number = backend[1];

      title_xml = await this.downloadContent(url, 'document', timeout);

      try {
        xml_document = new XMLParser().parse(title_xml, true);
        is_valid = true;
        break;
      } catch {
        this.logger.error(`Invalid XML!`);
      }
    }

    if (is_valid) {
      title_xml_cache.set(titleId, xml_document);
    }

    return xml_document;
  }

  async getXboxUnityTile(titleId: string): Promise<string> {
    const icon_base64: string = await this.downloadImageAsBase64(
      `http://xboxunity.net/Resources/Lib/Icon.php?tid=${titleId}`,
    );

    return icon_base64;
  }

  async getTitleName(titleId: string): Promise<string> {
    const xml_document = await this.getTitleXML(titleId);

    let title: string = '';

    try {
      title = xml_document['a:feed']['a:entry']['a:title'];

      if (!title) {
        title = xml_document['a:feed']['a:entry']['fullTitle'];
      }
    } catch {
      this.logger.error(`Failed to get title name!`);
    }

    return title;
  }

  async getTileURL(titleId: string): Promise<string> {
    const xml_document = await this.getTitleXML(titleId);

    let title_url: string = '';

    try {
      const images: any = xml_document['a:feed']['a:entry']['images']['image'];

      const image = images.find((img: any) => img.size == 14);
      title_url = image.fileUrl;
    } catch {
      this.logger.error(`Failed to get tile URL!`);
    }

    return title_url;
  }

  async getTitleTileIcon(titleId: string): Promise<string> {
    if (icon_cache.has(titleId)) {
      return icon_cache.get(titleId);
    }

    let icon_base64: string = '';

    const xml_document = await this.getTitleXML(titleId);

    if (xml_document) {
      try {
        const images: any =
          xml_document['a:feed']['a:entry']['images']['image'];

        const image = images.find((img: any) => img?.size == 14);
        let tileUrl: string;

        // If size property doesn't exist use first tile
        if (image) {
          tileUrl = image.fileUrl;
        } else if (images.length > 0) {
          tileUrl = images[0].fileUrl;
        }

        if (tileUrl) {
          icon_base64 = await this.downloadImageAsBase64(tileUrl);

          // Don't cache empty response
          if (icon_base64) {
            icon_cache.set(titleId, icon_base64);
          }
        }
      } catch {
        this.logger.error('Failed get tile.');
      }
    }

    return icon_base64;
  }

  async getTitleJsonInfo(titleId: string): Promise<object> {
    if (title_info_cache.has(titleId)) {
      return title_info_cache.get(titleId);
    }

    // will return empty object if title not found.
    const title_info = await this.downloadContent(
      `http://xboxunity.net/Resources/Lib/Title.php?tid=${titleId}`,
      'json',
      500,
    );

    if (title_info) {
      // Check if returned object was empty.
      if (title_info.TitleID) {
        title_info_cache.set(titleId, title_info);
      }
    }
  }

  async getHostGamertag(session: Session): Promise<string> {
    if (session.HasProperties()) {
      const HostGamerNameProperty = session.propertyHostGamerName;

      if (HostGamerNameProperty) {
        const HostGamerName = HostGamerNameProperty.getUTF16();

        // Check for empty HostGamerName incase of base64 corruption
        if (HostGamerName) {
          return HostGamerName;
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

    for (const session of sessions) {
      const title_id = session.titleId.toString();

      let game_title: string = await this.getTitleName(title_id);
      const tile_icon: string = await this.getTitleTileIcon(title_id);
      const title_info_json: object = await this.getTitleJsonInfo(title_id);

      // Fallback to title from session
      if (!game_title) {
        if (XStringVerify.Verify(session.title)) {
          game_title = session.title;
        }
      }

      const HOST_XUID: Xuid = session.getHostXUID;
      const HOST_PRESENCE_STRING: string =
        await this.getHostPresenceString(session);
      const HOST_GAMERTAG: string = await this.getHostGamertag(session);
      const PlayerGamertags = new Array<string>();

      PlayerGamertags.push(HOST_GAMERTAG);

      let defaulting_gamertags: number = 0;
      let local_defaulting_gamertags: number = 0;

      let players_count: number = 0;
      if (session.players.size > 1) {
        for (const player_xuid of session.players.keys()) {
          players_count++;

          const peer = await this.player_repository_.findByXuid(
            new Xuid(player_xuid),
          );

          // Player is local if they're not registered
          if (!peer) {
            // Skip Defaulting Host
            if (session.players.size == 1) {
              continue;
            }

            local_defaulting_gamertags++;
            PlayerGamertags.push(`Local Player ${local_defaulting_gamertags}`);

            continue;
          }

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
            PlayerGamertags.push(peer_gamertag);
          } else {
            defaulting_gamertags++;
            PlayerGamertags.push(`Player ${defaulting_gamertags}`);
          }
        }
      }

      let index = titles['Titles'].findIndex(
        (title: { titleId: string }) => title.titleId == title_id,
      );

      if (index == -1) {
        const data = {
          titleId: title_id,
          name: game_title,
          icon: tile_icon,
          info: title_info_json,
          sessions: [],
        };

        titles['Titles'].push(data);

        index = titles['Titles'].length - 1;
      }

      const data = {
        mediaId: session.mediaId,
        version: session.version,
        players: PlayerGamertags,
        total: session.totalSlots,
        host_presence: HOST_PRESENCE_STRING,
        host_gamertag: HOST_GAMERTAG,
        host_xuid: HOST_XUID?.value,
      };

      titles['Titles'][index]['sessions'].push(data);
    }

    this.logger.verbose(`XML Cache Count: ${title_xml_cache.size}`);
    this.logger.verbose(`JSON Cache Count: ${title_info_cache.size}`);
    this.logger.verbose(`Tile Icon Cache Count: ${icon_cache.size}`);

    this.logger.verbose('Recent Games:');
    for (const [titleId, _xml_document] of title_xml_cache) {
      const title_name = await this.getTitleName(titleId);

      if (title_name) {
        this.logger.verbose(title_name);
      }
    }

    return JSON.stringify(titles);
  }
}
