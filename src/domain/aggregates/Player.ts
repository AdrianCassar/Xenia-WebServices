import IpAddress from '../value-objects/IpAddress';
import MacAddress from '../value-objects/MacAddress';
import SessionId from '../value-objects/SessionId';
import Xuid from '../value-objects/Xuid';
import Gamertag from '../value-objects/Gamertag';
import TitleId from '../value-objects/TitleId';
import StateFlag, { StateFlags } from '../value-objects/StateFlag';
import UserSetting, {
  XUserSetting,
  DefaultGamerpic,
} from '../value-objects/UserSetting';
import { Table } from 'console-table-printer';

interface PlayerProps {
  xuid: Xuid;
  gamertag?: Gamertag;
  settings?: Map<string, Array<UserSetting>>;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  machineId: Xuid;
  port: number;
  sessionId?: SessionId;
  titleId?: TitleId;
  state?: StateFlag;
  richPresence?: string;
}

interface CreateProps {
  xuid: Xuid;
  gamertag: Gamertag;
  settings: Map<string, Array<UserSetting>>;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  machineId: Xuid;
}

export default class Player {
  private readonly props: PlayerProps;
  public constructor(props: PlayerProps) {
    this.props = props;

    if (!props?.gamertag) {
      props.gamertag = new Gamertag('Xenia User');
    }

    if (!props?.settings) {
      props.settings = new Map<string, Array<UserSetting>>();

      // Default Gamerpic
      props.settings.set('FFFE07D1', [DefaultGamerpic]);
    }
  }

  public static create(props: CreateProps) {
    return new Player({
      ...props,
      port: 36000, // Port hard-coded?
      state: new StateFlag(
        StateFlags.ONLINE | StateFlags.JOINABLE | StateFlags.PLAYING,
      ),
      sessionId: new SessionId('0'.repeat(16)),
      titleId: new TitleId('0'),
      richPresence: '',
    });
  }

  public updatePlayer(player: Player) {
    this.props.xuid = player.xuid;
    this.props.gamertag = player.gamertag;
    this.props.settings = player.settings;
    this.props.hostAddress = player.hostAddress;
    this.props.macAddress = player.macAddress;
    this.props.machineId = player.machineId;
    this.props.port = player.port;
    this.props.sessionId = player.sessionId;
    this.props.titleId = player.titleId;
    this.props.state = player.state;
    this.props.richPresence = player.richPresence;
  }

  public setSession(sessionId: SessionId) {
    this.props.sessionId = sessionId;
  }

  public setTitleId(titleId: TitleId) {
    this.props.titleId = titleId;
  }

  public setGamertag(gamertag: Gamertag) {
    this.props.gamertag = gamertag;
  }

  public setSettings(settings: Map<string, Array<UserSetting>>) {
    this.props.settings = settings;
  }

  public setRichPresence(richPresence: string) {
    this.props.richPresence = richPresence;
  }

  public setState(state: StateFlag) {
    this.props.state = state;
  }

  get xuid() {
    return this.props.xuid;
  }

  get hostAddress() {
    return this.props.hostAddress;
  }

  get gamertag() {
    return this.props.gamertag;
  }

  get settings() {
    return this.props.settings;
  }

  get machineId() {
    return this.props.machineId;
  }

  get macAddress() {
    return this.props.macAddress;
  }

  get port() {
    return this.props.port;
  }

  get sessionId() {
    return this.props.sessionId;
  }

  get titleId() {
    return this.props.titleId;
  }

  get state() {
    return this.props.state;
  }

  get richPresence() {
    return this.props.richPresence;
  }

  public getSetting(title_id: string, setting_id: XUserSetting): UserSetting {
    if (this.settings.has(title_id)) {
      const title_settings = this.settings.get(title_id);

      for (const setting of title_settings) {
        if (setting.getID() == setting_id) {
          return setting;
        }
      }
    }

    return undefined;
  }

  public getSettingsStringArray(): Map<string, Array<string>> {
    const base64_settings = new Map<string, Array<string>>();

    if (this.props?.settings) {
      for (const [title_id, settings] of this.props.settings) {
        for (const setting of settings) {
          if (base64_settings.has(title_id)) {
            base64_settings.get(title_id).push(setting.toString());
          } else {
            base64_settings.set(title_id, [setting.toString()]);
          }
        }
      }
    }

    return base64_settings;
  }

  public updateSettings(settings: Map<string, Array<string>>) {
    const tables: Array<Table> = new Array<Table>();

    for (const [title_id, base64_settings] of settings) {
      const table = getUserSettingsTable();

      table.table.columns.find((col) => col.title === 'Value').title =
        'New Value';

      table.addColumn({
        name: `column7`,
        title: 'Old Value',
        alignment: 'center',
      });

      table.addColumn({
        name: `column8`,
        title: 'State',
        alignment: 'center',
      });

      table.table.title = title_id;

      for (const base64 of base64_settings) {
        const new_setting = new UserSetting(base64);
        const old_setting = this.getSetting(title_id, new_setting.getID());

        if (new_setting.getData().equals(old_setting.getData())) {
          continue;
        }

        if (this.props.settings.has(title_id)) {
          // Update Setting
          const setting_index = this.props.settings
            .get(title_id)
            .findIndex((setting) => {
              return setting.getID() == new_setting.getID();
            });

          if (setting_index != -1) {
            this.props.settings.get(title_id)[setting_index] = new_setting;

            table.addRow(
              {
                column1: new_setting.getFriendlyName(),
                column2: `${!new_setting.isTitleSpecific() ? 'Dashboard' : 'Title'}`,
                column3: `0x${new_setting.getIDHexString()}`,
                column4: `${new_setting.getTypeString()}`,
                column5: `${new_setting.getSizeFromType()}`,
                column6: new_setting.getParsedData(),
                column7: old_setting.getParsedData(),
                column8: 'Updated',
              },
              {
                color: `${!new_setting.isTitleSpecific() ? 'blue' : 'magenta'}`,
              },
            );
          }
        } else {
          // New Setting
          this.props.settings.set(title_id, [new_setting]);

          table.addRow(
            {
              column1: new_setting.getFriendlyName(),
              column2: `${!new_setting.isSystemProperty() ? 'Dashboard' : 'Title'}`,
              column3: `0x${new_setting.getIDHexString()}`,
              column4: `${new_setting.getTypeString()}`,
              column5: `${new_setting.getSizeFromType()}`,
              column6: new_setting.getParsedData(),
              column7: 'N/A',
              column8: 'Added',
            },
            {
              color: `${!new_setting.isSystemProperty() ? 'blue' : 'magenta'}`,
            },
          );
        }
      }

      tables.push(table);
    }

    tables.forEach((table) => {
      table.printTable();
    });
  }

  public PrettyPrintUserSettingsTable() {
    this.settings.forEach((settings, title_id) => {
      const table = getUserSettingsTable();

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

      table.printTable();
    });
  }
}

export function getUserSettingsTable(): Table {
  const table = new Table({
    columns: [
      {
        name: `column1`,
        title: 'Name',
        alignment: 'center',
      },
      {
        name: `column2`,
        title: 'Type',
        alignment: 'center',
      },
      {
        name: `column3`,
        title: 'ID',
        alignment: 'center',
      },
      {
        name: `column4`,
        title: 'Data Type',
        alignment: 'center',
      },
      {
        name: `column5`,
        title: 'Size',
        alignment: 'center',
      },
      {
        name: `column6`,
        title: 'Value',
        alignment: 'center',
      },
    ],
  });

  return table;
}
