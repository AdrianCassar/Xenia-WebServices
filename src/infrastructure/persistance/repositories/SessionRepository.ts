import { Model } from 'mongoose';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { SessionDocument } from '../models/SessionSchema';
import ISessionRepository from 'src/domain/repositories/ISessionRepository';
import Session from 'src/domain/aggregates/Session';
import SessionDomainMapper from '../mappers/SessionDomainMapper';
import SessionPersistanceMapper from '../mappers/SessionPersistanceMapper';
import TitleId from 'src/domain/value-objects/TitleId';
import SessionId from 'src/domain/value-objects/SessionId';
import Xuid from 'src/domain/value-objects/Xuid';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import Property, { XContext } from 'src/domain/value-objects/Property';
import { MatchmakingConstant } from 'src/domain/value-objects/XLast';
import { Table } from 'console-table-printer';

@Injectable()
export default class SessionRepository implements ISessionRepository {
  constructor(
    private readonly logger: ConsoleLogger,
    @InjectModel(Session.name)
    private SessionModel: Model<SessionDocument>,
    private readonly sessionDomainMapper: SessionDomainMapper,
    private readonly sessionPersistanceMapper: SessionPersistanceMapper,
  ) {
    this.logger.setContext(SessionRepository.name);
  }

  public async save(session: Session) {
    await this.SessionModel.findOneAndUpdate(
      {
        id: session.id.value,
        titleId: session.titleId.toString(),
      },
      this.sessionPersistanceMapper.mapToDataModel(session, new Date()),
      {
        upsert: true,
        returnDocument: 'after',
      },
    );
  }

  public async findSessionsByIPAndMac(ip: IpAddress, mac: MacAddress) {
    const query: Record<string, string> = { hostAddress: ip.value.toString() };

    if (mac) {
      query.macAddress = mac.value.toString();
    }

    const sessions = await this.SessionModel.find(query);

    if (!sessions) {
      return undefined;
    }

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  public async deleteSessions(sessions: Session[]) {
    if (sessions.length === 0) {
      this.logger.debug('Sessions already deleted.');
    }

    for (const session of sessions) {
      await this.SessionModel.findOneAndDelete({
        id: session.id.value,
        titleId: session.titleId.toString(),
      });

      const qosPath = join(
        process.cwd(),
        'qos',
        session.titleId.toString(),
        session.id.value,
      );

      // Delete QoS data for the session.
      if (existsSync(qosPath)) {
        await unlink(qosPath);
      }

      this.logger.debug(
        `Deleted Session: ${session.id.value} from ${session.hostAddress.value}`,
      );
    }
  }

  public async findSession(titleId: TitleId, id: SessionId) {
    const session = await this.SessionModel.findOne({
      id: id.value,
      titleId: titleId.toString(),
    });

    if (!session) {
      return undefined;
    }

    return this.sessionDomainMapper.mapToDomainModel(session);
  }

  public async findByPlayer(xuid: Xuid) {
    const session = await this.SessionModel.findOne({
      [`players.${xuid.value}`]: true,
    });

    if (!session) {
      return undefined;
    }

    return this.sessionDomainMapper.mapToDomainModel(session);
  }

  public async findAdvertisedSessions(
    titleId: TitleId,
    searcher_xuid: Xuid,
    resultsCount: number,
    numUsers: number,
    query_id: number,
    filters: Array<string>,
  ) {
    // Technically limit should be applied after filtering sessions.
    const sessionsDocs = await this.SessionModel.find({
      titleId: titleId.toString(),
      xuid: { $ne: searcher_xuid.value },
      context: { $exists: true },
      $expr: { $gt: [{ $size: { $objectToArray: '$context' } }, 0] },
      'properties.0': { $exists: true },
      advertised: true,
      deleted: false,
      migration: undefined,
    }).limit(resultsCount);

    let sessions: Session[] = sessionsDocs.map(
      this.sessionDomainMapper.mapToDomainModel,
    );

    // Remove private sessions
    sessions = sessions.filter((session) => {
      return session.publicSlotsCount != 0;
    });

    // Remove sessions that are full
    sessions = sessions.filter((session) => {
      return !session.isfull;
    });

    // Include matchmaking sessions
    sessions = sessions.filter((session) => {
      return session.flags.isMatchmaking;
    });

    // Remove sessions with not enough slots
    if (numUsers) {
      sessions = sessions.filter((session) => {
        if (
          session.availablePublicSlots >= numUsers ||
          session.availablePrivateSlots >= numUsers
        ) {
          return true;
        }
      });
    }

    const properties: Property[] = filters?.map(
      (filter) => new Property(filter),
    );

    // Apply session filtering
    sessions = sessions.filter((session) => {
      const xlast_src = session.GetXLastSource();

      // Backwards compatibility.
      if (properties === undefined) {
        this.logger.verbose(`Matchmaking Query ID: ${query_id}`);
        return true;
      }

      const evaluation_table = this.filterEvaluationTable(session.id);
      const optional_evaluations = this.optionalFilterEvaluationTable(
        session.id,
      );

      const session_properties = session.propertiesComplete;

      const session_game_mode = session_properties.find(
        (prop) => prop.getID() === <number>XContext.GAME_MODE,
      );

      const session_game_type = session_properties.find(
        (prop) => prop.getID() === <number>XContext.GAME_TYPE,
      );

      // Always check game mode and game type, sometimes it's missing from XLast filters.
      const game_mode: Property = properties.find(
        (property) => <number>property.id === <number>XContext.GAME_MODE,
      );

      const game_type: Property = properties.find(
        (property) => <number>property.id === <number>XContext.GAME_TYPE,
      );

      if (!session_game_mode || !session_game_type) {
        return false;
      }

      if (!game_mode || !game_type) {
        return false;
      }

      const valid_game_mode =
        game_mode.getParsedValue() === session_game_mode.getParsedValue();
      const valid_game_type =
        game_type.getParsedValue() === session_game_type.getParsedValue();

      evaluation_table.addRow(
        {
          column1: `Attribute`,
          column2: `${game_mode.getParsedValue()}`,
          column3: `==`,
          column4: `${session_game_mode.getParsedValue()}`,
          column5: `Parameter`,
          column6: `${valid_game_mode ? 'True' : 'False'}`,
        },
        { color: `${valid_game_mode ? 'blue' : 'magenta'}` },
      );

      evaluation_table.addRow(
        {
          column1: `Attribute`,
          column2: `${game_type.getParsedValue()}`,
          column3: `==`,
          column4: `${session_game_type.getParsedValue()}`,
          column5: `Parameter`,
          column6: `${valid_game_type ? 'True' : 'False'}`,
        },
        { color: `${valid_game_type ? 'blue' : 'magenta'}` },
      );

      // Titles without embedded XLast source.
      if (xlast_src === undefined) {
        this.logger.verbose(`Matchmaking Query ID: ${query_id}`);

        evaluation_table.printTable();
        console.log();

        return valid_game_mode && valid_game_type;
      }

      const matchmaking_query =
        xlast_src.XboxLiveSubmissionProject.GameConfigProject.Matchmaking.Queries.Query.find(
          (query) => query.id === query_id,
        );

      if (!matchmaking_query.Filters) {
        this.logger.verbose(`Matchmaking Query ID: ${query_id}`);

        evaluation_table.printTable();
        console.log();

        return valid_game_mode && valid_game_type;
      }

      this.logger.verbose(
        `Matchmaking Query: ${matchmaking_query.friendlyName}`,
      );

      const game_mode_filter = matchmaking_query.Filters.Filter.find(
        (filter) => filter.left === <number>XContext.GAME_MODE,
      );

      const game_type_filter = matchmaking_query.Filters.Filter.find(
        (filter) => filter.left === <number>XContext.GAME_TYPE,
      );

      let evaluations_offset = 0;

      if (game_mode_filter) {
        evaluation_table.table.rows.splice(0, 1);
      } else {
        evaluations_offset++;
      }

      if (game_type_filter) {
        evaluation_table.table.rows.splice(0, 1);
      } else {
        evaluations_offset++;
      }

      const evaluations_count =
        matchmaking_query.Filters.Filter.length + evaluations_offset;

      const evaluations: Array<boolean> = new Array(evaluations_count).fill(
        false,
      );

      let evaluation_index: number = 0;

      if (game_mode_filter === undefined) {
        evaluations[evaluation_index] = valid_game_mode;
        evaluation_index++;
      }

      if (game_type_filter === undefined) {
        evaluations[evaluation_index] = valid_game_type;
      }

      matchmaking_query.Filters.Filter.forEach((filter_spec, i) => {
        let left_value: bigint = undefined;
        let right_value: bigint = undefined;

        switch (filter_spec.leftType) {
          case 'Attribute':
            {
              const property: Property = session_properties.find(
                (prop) => prop.getID() === filter_spec.left,
              );

              if (property) {
                left_value = <bigint>property.getParsedValue();
              }
            }
            break;
          case 'Parameter':
          case 'Constant':
          case 'ContextValue':
            // Unsupported
            break;
        }

        switch (filter_spec.rightType) {
          case 'Attribute':
            // Unsupported
            break;
          case 'ContextValue':
          case 'Parameter':
            {
              const property: Property = properties.find((property) => {
                return property.getID() === filter_spec.right;
              });

              if (property) {
                right_value = <bigint>property.getParsedValue();
              }
            }
            break;
          case 'Constant':
            {
              const constant: MatchmakingConstant =
                xlast_src.XboxLiveSubmissionProject.GameConfigProject.Matchmaking.Constants.Constant.find(
                  (constant) => constant.id === filter_spec.right,
                );

              if (constant) {
                right_value = BigInt(constant.value);
              }
            }
            break;
        }

        let evaluation: boolean = false;

        if (left_value != undefined && right_value != undefined) {
          switch (filter_spec.op) {
            case '==':
              {
                evaluation = left_value === right_value;
              }
              break;
            case '!=':
              {
                evaluation = left_value != right_value;
              }
              break;
            case '>':
              {
                evaluation = left_value > right_value;
              }
              break;
            case '<':
              {
                evaluation = left_value < right_value;
              }
              break;
            case '<=':
              {
                evaluation = left_value <= right_value;
              }
              break;
            case '>=':
              {
                evaluation = left_value >= right_value;
              }
              break;
          }

          evaluation_table.addRow(
            {
              column1: `${filter_spec.leftType}`,
              column2: `${left_value}`,
              column3: `${filter_spec.op}`,
              column4: `${right_value}`,
              column5: `${filter_spec.rightType}`,
              column6: `${evaluation ? 'True' : 'False'}`,
            },
            { color: `${evaluation ? 'blue' : 'magenta'}` },
          );
        } else {
          optional_evaluations.addRow(
            {
              column1: `${filter_spec.leftType}`,
              column2: `0x${filter_spec.left.toString(16).toUpperCase().padStart(8, '0')}`,
              column3: `${filter_spec.op}`,
              column4: `0x${filter_spec.right.toString(16).toUpperCase().padStart(8, '0')}`,
              column5: `${filter_spec.rightType}`,
            },
            { color: 'red' },
          );

          evaluation = true;
        }

        evaluations[i + evaluations_offset] = evaluation;
      });

      evaluation_table.printTable();
      console.log();

      if (optional_evaluations.table.rows.length > 0) {
        optional_evaluations.printTable();
        console.log();
      }

      return !evaluations.includes(false);
    });

    return sessions;
  }

  public async findAllAdvertisedSessions() {
    const sessions = await this.SessionModel.find(
      {
        context: { $exists: true },
        $expr: { $gt: [{ $size: { $objectToArray: '$context' } }, 0] },
        'properties.0': { $exists: true },
        advertised: true,
        deleted: false,
        migration: undefined,
      },
      undefined,
    );

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  public async findTitleSessions(titleId: TitleId): Promise<Session[]> {
    const sessions = await this.SessionModel.find(
      {
        titleId: titleId.toString(),
        context: { $exists: true },
        $expr: { $gt: [{ $size: { $objectToArray: '$context' } }, 0] },
        'properties.0': { $exists: true },
        advertised: true,
        deleted: false,
        migration: undefined,
      },
      undefined,
    );

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  filterEvaluationTable(session_id: SessionId) {
    const table = new Table({
      title: `Evaluation Filter Results - ${session_id.value.toUpperCase()}`,
      columns: [
        {
          name: `column1`,
          title: 'Left Type',
          alignment: 'center',
        },
        {
          name: `column2`,
          title: 'Left',
          alignment: 'center',
        },
        {
          name: `column3`,
          title: 'Operator',
          alignment: 'center',
        },
        {
          name: `column4`,
          title: 'Right',
          alignment: 'center',
        },
        {
          name: `column5`,
          title: 'Right Type',
          alignment: 'center',
        },
        {
          name: `column6`,
          title: 'Evaluation',
          alignment: 'center',
        },
      ],
    });

    return table;
  }

  optionalFilterEvaluationTable(session_id: SessionId) {
    const table = new Table({
      title: `Optional Evaluation Filters - ${session_id.value.toUpperCase()}`,
      columns: [
        {
          name: `column1`,
          title: 'Left Type',
          alignment: 'center',
        },
        {
          name: `column2`,
          title: 'Property ID',
          alignment: 'center',
        },
        {
          name: `column3`,
          title: 'Operator',
          alignment: 'center',
        },
        {
          name: `column4`,
          title: 'Property ID',
          alignment: 'center',
        },
        {
          name: `column5`,
          title: 'Right Type',
          alignment: 'center',
        },
      ],
    });

    return table;
  }
}
