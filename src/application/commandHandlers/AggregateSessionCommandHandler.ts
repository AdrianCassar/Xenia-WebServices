import { ConsoleLogger, Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { AggregateSessionCommand } from '../commands/AggregateSessionCommand';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import axios, { AxiosRequestConfig, ResponseType } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { AxiosResponse } from 'axios';

const icon_cache = new Map<string, string>();
const title_info_cache = new Map<string, object>();
const title_xml_cache = new Map<string, object>();

@CommandHandler(AggregateSessionCommand)
export class AggregateSessionCommandHandler
  implements ICommandHandler<AggregateSessionCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
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

    const backends: Array<string> = [];

    backends.push(`https://xboxpreservation.org/api/xml/${titleId}`);
    backends.push(
      `https://marketplace-xb.xboxlive.com/marketplacecatalog/v1/product/en-US/66ACD000-77FE-1000-9115-D802${titleId}?bodytypes=1.3&detailview=detaillevel5&pagenum=1&pagesize=1&stores=1&tiers=2.3&offerfilter=1&producttypes=1.5.18.19.20.21.22.23.30.34.37.46.47.61`,
    );
    backends.push(
      `https://raw.githubusercontent.com/wildmaster84/restored-media/refs/heads/main/${titleId}/${titleId.toLowerCase()}.xml`,
    );

    let title_xml: string = '';
    let is_valid = true;

    let xml_document = undefined;

    for (const backend of backends) {
      title_xml = await this.downloadContent(backend, 'document');

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
    } catch {
      this.logger.error(`Title property not available for ${titleId}.`);
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
      this.logger.error(`Tile URL property not available for ${titleId}.`);
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

        const image = images.find((img: any) => img.size == 14);
        const tileUrl: string = image.fileUrl;

        if (tileUrl) {
          icon_base64 = await this.downloadImageAsBase64(tileUrl);

          // Don't cache empty response
          if (icon_base64) {
            icon_cache.set(titleId, icon_base64);
          }
        }
      } catch {
        this.logger.error(`Tile icon not available for ${titleId}.`);
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

  async execute() {
    const sessions = await this.repository.findAllAdvertisedSessions();

    const titles = {};

    titles['Titles'] = [];

    for (const session of sessions) {
      const title_id = session.titleId.toString();

      const game_title: string = await this.getTitleName(title_id);
      const tile_icon: string = await this.getTitleTileIcon(title_id);
      const title_info_json: object = await this.getTitleJsonInfo(title_id);

      let index = titles['Titles'].findIndex(
        (title) => title.titleId == title_id,
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
        players: session.players.size,
        total: session.totalSlots,
      };

      titles['Titles'][index]['sessions'].push(data);
    }

    this.logger.verbose(`XML Cache Count: ${title_xml_cache.size}`);
    this.logger.verbose(`JSON Cache Count: ${title_info_cache.size}`);
    this.logger.verbose(`Tile Icon Cache Count: ${icon_cache.size}`);

    this.logger.verbose(``);

    this.logger.verbose('Recent Games:');
    for (const [titleId, _xml_document] of title_xml_cache) {
      this.logger.verbose(await this.getTitleName(titleId));
    }

    return JSON.stringify(titles);
  }
}
