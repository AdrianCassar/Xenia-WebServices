import {
  Controller,
  Get,
  Delete,
  NotFoundException,
  Param,
  RawBodyRequest,
  HttpException,
  HttpStatus,
  ConsoleLogger,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import TitleId from 'src/domain/value-objects/TitleId';
import { Body, Post, Req, Res } from '@nestjs/common/decorators';
import { CreateSessionRequest } from '../requests/CreateSessionRequest';
import { CreateSessionCommand } from 'src/application/commands/CreateSessionCommand';
import SessionId from 'src/domain/value-objects/SessionId';
import IpAddress from 'src/domain/value-objects/IpAddress';
import SessionFlags from 'src/domain/value-objects/SessionFlags';
import { GetSessionQuery } from 'src/application/queries/GetSessionQuery';
import { SessionSearchQuery } from 'src/application/queries/SessionSearchQuery';
import SessionPresentationMapper from '../mappers/SessionPresentationMapper';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { ModifySessionCommand } from 'src/application/commands/ModifySessionCommand';
import { ModifySessionRequest } from '../requests/ModifySessionRequest';
import { JoinSessionCommand } from 'src/application/commands/JoinSessionCommand';
import { JoinSessionRequest } from '../requests/JoinSessionRequest';
import { GetSessionContextRequest } from '../requests/GetSessionContextRequest';
import { GetSessionPropertyRequest } from '../requests/GetSessionPropertyRequest';
import Xuid from 'src/domain/value-objects/Xuid';
import { SessionSearchRequest } from '../requests/SessionSearchRequest';
import { SessionDetailsResponse } from '../responses/SessionDetailsResponse';
import { LeaveSessionRequest } from '../requests/LeaveSessionRequest';
import { LeaveSessionCommand } from 'src/application/commands/LeaveSessionCommand';
import { DeleteSessionCommand } from 'src/application/commands/DeleteSessionCommand';
import { AddSessionContextCommand } from 'src/application/commands/AddSessionContextCommand';
import { AddSessionPropertyCommand } from 'src/application/commands/AddSessionPropertyCommand';
import { SessionArbitrationResponse } from '../responses/SessionArbitrationResponse';
import { SessionContextResponse } from '../responses/SessionContextResponse';
import { SessionPropertyResponse } from '../responses/SessionPropertyResponse';
import Player from 'src/domain/aggregates/Player';
import { GetPlayerQuery } from 'src/application/queries/GetPlayerQuery';
import { FindPlayerQuery } from 'src/application/queries/FindPlayerQuery';
import { Request, Response } from 'express';
import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readFileSync, createReadStream } from 'fs';
import { UpdateLeaderboardCommand } from 'src/application/commands/UpdateLeaderboardCommand';
import LeaderboardId from 'src/domain/value-objects/LeaderboardId';
import { WriteStatsRequest } from '../requests/WriteStatsRequest';
import PropertyId from 'src/domain/value-objects/PropertyId';
import { LeaderboardUpdateProps } from 'src/domain/aggregates/Leaderboard';
import { MigrateSessionCommand } from 'src/application/commands/MigrateSessionCommand';
import { MigrateSessionRequest } from '../requests/MigrateSessionRequest';
import { RealIP } from 'nestjs-real-ip';
import { ProcessClientAddressCommand } from 'src/application/commands/ProcessClientAddressCommand';
import Session from 'src/domain/aggregates/Session';
import { UpdatePlayerCommand } from 'src/application/commands/UpdatePlayerCommand';
import { GetTitleSessionsQuery } from 'src/application/queries/GetTitleSessionsQuery';
import SessionDetailsPresentationMapper from '../mappers/SessionDetailsPresentationMapper';
import { PreJoinRequest } from '../requests/PreJoinRequest';
import Property, { X_USER_DATA_TYPE } from 'src/domain/value-objects/Property';

@ApiTags('Sessions')
@Controller('/title/:titleId/sessions')
export class SessionController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly sessionMapper: SessionPresentationMapper,
    private readonly sessionDetailsMapper: SessionDetailsPresentationMapper,
  ) {
    this.logger.setContext(SessionController.name);
  }

  @Post()
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  async createSession(
    @Param('titleId') titleId: string,
    @Body() request: CreateSessionRequest,
  ) {
    const flags = new SessionFlags(request.flags);

    if (flags.isHost) {
      this.logger.debug('Host creating session: ' + request.sessionId);

      await this.commandBus.execute(
        new CreateSessionCommand(
          new TitleId(titleId),
          request.xuid ? new Xuid(request.xuid) : undefined,
          request.title,
          request.mediaId,
          request.version,
          new SessionId(request.sessionId),
          new IpAddress(request.hostAddress),
          new SessionFlags(request.flags),
          request.publicSlotsCount,
          request.privateSlotsCount,
          new MacAddress(request.macAddress),
          request.port,
        ),
      );

      if (flags.isStatsSession) {
        this.logger.debug('Updating Stats.');
      }

      const player: Player = await this.queryBus.execute(
        new FindPlayerQuery(new IpAddress(request.hostAddress)),
      );

      // If player doesn't exists add them to players table
      if (player) {
        if (flags.isAdvertised) {
          player.setSession(new SessionId(request.sessionId));

          await this.commandBus.execute(
            new UpdatePlayerCommand(player.xuid, player),
          );
        } else {
          this.logger.verbose(`Skip updating presence`);
        }
      } else {
        this.logger.debug(`Player not found: ${request.hostAddress}`);

        throw new HttpException('Unknown Player', HttpStatus.BAD_REQUEST);
      }
    } else {
      this.logger.debug(`Peer joining session: ${request.sessionId}`);

      const session = await this.queryBus.execute(
        new GetSessionQuery(
          new TitleId(titleId),
          new SessionId(request.sessionId),
        ),
      );

      if (!session) {
        this.logger.debug(`Session ${request.sessionId} was not found.`);
      }
    }
  }

  @Get('/search')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  async GetTitleSessions(@Param('titleId') titleId: string) {
    const sessions: Session[] = await this.queryBus.execute(
      new GetTitleSessionsQuery(new TitleId(titleId)),
    );

    return sessions.map(this.sessionDetailsMapper.CreateSessionDetails);
  }

  @Get('/:sessionId')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async getSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const session: Session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return this.sessionMapper.mapToPresentationModel(session);
  }

  @Post('/:sessionId/migrate')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async migrateSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: MigrateSessionRequest,
  ) {
    const session: Session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    const newSession: Session = await this.commandBus.execute(
      new MigrateSessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        request.xuid ? new Xuid(request.xuid) : undefined,
        new IpAddress(request.hostAddress),
        new MacAddress(request.macAddress),
        request.port,
      ),
    );

    if (request.xuid) {
      const player: Player = await this.queryBus.execute(
        new GetPlayerQuery(new Xuid(request.xuid)),
      );

      const flags = new SessionFlags(session.flags.value);

      if (player && flags.isAdvertised) {
        player.setSession(newSession.id);

        await this.commandBus.execute(
          new UpdatePlayerCommand(player.xuid, player),
        );
      } else {
        this.logger.verbose(`Skip updating presence`);
      }
    }

    return this.sessionMapper.mapToPresentationModel(newSession);
  }

  @Delete('/:sessionId')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async deleteSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @RealIP() ip: string,
  ) {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    const ipv4 = await this.commandBus.execute(
      new ProcessClientAddressCommand(ip),
    );

    if (!session) {
      this.logger.debug(`Session ${sessionId} is already deleted.`);
      return;
    }

    if (session.hostAddress.value !== ipv4) {
      this.logger.debug(
        `Client ${ipv4} attempted to delete session created by ${session.hostAddress.value}`,
      );
      this.logger.debug(`Session ${sessionId} will not be deleted.`);
      return;
    }

    const result: Session = await this.commandBus.execute(
      new DeleteSessionCommand(new TitleId(titleId), new SessionId(sessionId)),
    );

    // Reset player's session id and title id when they delete a session.
    // Problem is supporting multiple session instances

    if (!result.deleted) {
      throw new NotFoundException(
        `Failed to soft delete session ${sessionId}.`,
      );
    }
  }

  @Get('/:sessionId/details')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async getSessionDetails(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionDetailsResponse> {
    const session: Session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    const xuids: string[] = Array.from(session.players.keys());

    return {
      id: session.id.value,
      flags: session.flags.value,
      hostAddress: session.hostAddress.value,
      port: session.port,
      macAddress: session.macAddress.value,
      publicSlotsCount: session.publicSlotsCount,
      privateSlotsCount: session.privateSlotsCount,
      openPublicSlotsCount: session.availablePublicSlots,
      openPrivateSlotsCount: session.availablePrivateSlots,
      filledPublicSlotsCount: session.filledPublicSlots,
      filledPrivateSlotsCount: session.filledPrivateSlots,
      players: xuids.map((xuid) => ({ xuid: xuid })),
    };
  }

  @Get('/:sessionId/arbitration')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async getSessionArbitration(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionArbitrationResponse> {
    const session: Session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    const xuids: string[] = Array.from(session.players.keys());

    const players: Player[] = await Promise.all(
      xuids.map((xuid) => {
        return this.queryBus.execute(new GetPlayerQuery(new Xuid(xuid)));
      }),
    );

    const machinePlayers = {};

    players
      .filter((player) => player != undefined)
      .forEach((player) => {
        if (machinePlayers[player.machineId.value] !== undefined) {
          machinePlayers[player.machineId.value].push(player);
        } else {
          machinePlayers[player.machineId.value] = [player];
        }
      });

    const machines: SessionArbitrationResponse['machines'] = [];

    for (const [key, value] of Object.entries(machinePlayers)) {
      machines.push({
        id: key,
        players: (value as Player[]).map((player: Player) => {
          return { xuid: player.xuid.value };
        }),
      });
    }

    return {
      totalPlayers: players.length,
      machines,
    };
  }

  @Post('/:sessionId/modify')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async modifySession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: ModifySessionRequest,
  ) {
    const session = await this.commandBus.execute(
      new ModifySessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        new SessionFlags(request.flags),
        request.publicSlotsCount,
        request.privateSlotsCount,
      ),
    );

    if (!session) {
      throw new NotFoundException(
        `Failed to modify session ${sessionId} was not found.`,
      );
    }
  }

  @Post('/:sessionId/join')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async joinSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: JoinSessionRequest,
  ) {
    const members = new Map<Xuid, boolean>();

    request.xuids.forEach((xuid, index) => {
      // Default to public slot if slots are not provided
      const is_private: boolean = request.privateSlots
        ? request.privateSlots[index]
        : false;

      if (!request.privateSlots) {
        this.logger.debug('Defaulting to public slot');
      }

      members.set(new Xuid(xuid), is_private);
    });

    const session: Session = await this.commandBus.execute(
      new JoinSessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        members,
      ),
    );

    if (!session) {
      const error_msg = `Failed to join session ${sessionId} was not found.`;
      this.logger.debug(error_msg);

      throw new NotFoundException(error_msg);
    }

    const players_xuid = request.xuids.map((xuid) => xuid);

    const xuids: PreJoinRequest = {
      xuids: players_xuid,
    };

    await this.preJoin(titleId, sessionId, xuids);
  }

  @Post('/:sessionId/prejoin')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async preJoin(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: PreJoinRequest,
  ) {
    // Update joining players sessionId
    const players_xuid = request.xuids.map((xuid) => new Xuid(xuid));

    for (const player_xuid of players_xuid) {
      const player: Player = await this.queryBus.execute(
        new GetPlayerQuery(player_xuid),
      );

      if (player) {
        player.setSession(new SessionId(sessionId));
        player.setTitleId(new TitleId(titleId));

        await this.commandBus.execute(
          new UpdatePlayerCommand(player.xuid, player),
        );
      }
    }
  }

  @Post('/:sessionId/leave')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async leaveSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: LeaveSessionRequest,
  ) {
    const session: Session = await this.commandBus.execute(
      new LeaveSessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        request.xuids.map((xuid) => new Xuid(xuid)),
      ),
    );

    if (!session) {
      const error_msg = `Failed to leave session ${sessionId} was not found.`;
      this.logger.debug(error_msg);

      throw new NotFoundException(error_msg);
    }

    // Problem is supporting multiple session instances

    // Update leaving players
    // Reset player's session id when they leave a session.
    const players_xuid = request.xuids.map((xuid) => new Xuid(xuid));

    for (const player_xuid of players_xuid) {
      const player: Player = await this.queryBus.execute(
        new GetPlayerQuery(player_xuid),
      );

      const flags = new SessionFlags(session.flags.value);

      if (player && flags.isAdvertised) {
        player.setSession(new SessionId('0'.repeat(16)));

        await this.commandBus.execute(
          new UpdatePlayerCommand(player.xuid, player),
        );
      } else {
        this.logger.verbose(`Skip updating presence`);
      }
    }
  }

  @Post('/search')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  async sessionSearch(
    @Param('titleId') titleId: string,
    @Body() request: SessionSearchRequest,
  ) {
    const sessions: Session[] = await this.queryBus.execute(
      new SessionSearchQuery(
        new TitleId(titleId),
        request.searchIndex,
        request.resultsCount,
        request.numUsers,
      ),
    );

    return sessions.map(this.sessionMapper.mapToPresentationModel);
  }

  @Post('/:sessionId/qos')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async qosUpload(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const qosPath = join(process.cwd(), 'qos', titleId, sessionId);

    if (existsSync(qosPath)) {
      this.logger.debug('Updating QoS Data.');
    } else {
      await mkdir(join(process.cwd(), 'qos', titleId), { recursive: true });
      this.logger.debug('Saving QoS Data.');
    }

    // always write QoS data to ensure data is updated.
    await writeFile(qosPath, req.rawBody);
  }

  @Get('/:sessionId/qos')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async qosDownload(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const path = join(process.cwd(), 'qos', titleId, sessionId);

    if (!existsSync(path)) {
      res.set('Content-Length', '0');
      res.sendStatus(HttpStatus.NO_CONTENT);
      return;
    }

    const stats = await stat(path);

    if (!stats.isFile()) {
      throw new NotFoundException(`QoS data at ${path} not found.`);
    }

    res.set('Content-Length', stats.size.toString());
    const stream = createReadStream(path);
    stream.pipe(res);
  }

  @Post('/:sessionId/context')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async sessionContextSet(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: GetSessionContextRequest,
  ) {
    const session: Session = await this.commandBus.execute(
      new AddSessionContextCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        request.contexts,
      ),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }
  }

  @Get('/:sessionId/context')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async sessionContextGet(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionContextResponse> {
    const session: Session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return {
      context: session.context,
    };
  }

  @Post('/:sessionId/properties')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async sessionPropertySet(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: GetSessionPropertyRequest,
  ) {
    // Extract properties and exclude contexts
    const properties: Array<Property> = request.properties
      .filter((base64: string) => {
        const prop: Property = new Property(base64);

        return prop.type != X_USER_DATA_TYPE.CONTEXT;
      })
      .map((base64: string) => {
        return new Property(base64);
      });

    // Extract contexts from properties
    const contexts: Array<{ contextId: number; value: number }> =
      request.properties
        .filter((base64: string) => {
          const prop: Property = new Property(base64);

          return prop.type == X_USER_DATA_TYPE.CONTEXT;
        })
        .map((base64: string) => {
          const prop: Property = new Property(base64);
          const value = prop.getData().readUInt32BE();

          return { contextId: prop.id, value: value };
        });

    const context_session: Session = await this.commandBus.execute(
      new AddSessionContextCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        contexts,
      ),
    );

    if (!context_session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    const properties_session: Session = await this.commandBus.execute(
      new AddSessionPropertyCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        properties,
      ),
    );

    properties_session.PrettyPrintPropertiesTable();
  }

  @Get('/:sessionId/properties')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async sessionPropertyGet(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionPropertyResponse> {
    const session: Session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found.`);
    }

    return {
      properties: session.propertiesStringArray,
    };
  }

  @Post('/:sessionId/leaderboards')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'AE00000000000000' })
  async postLeaderboards(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: WriteStatsRequest,
  ) {
    this.logger.verbose(
      '\n' + JSON.stringify({ request: JSON.stringify(request) }),
    );

    const statsConfigPath = join(
      process.cwd(),
      './src/titles',
      titleId.toUpperCase(),
      'stats.json',
    );

    if (!existsSync(statsConfigPath)) {
      this.logger.warn(
        `No stats config found for title ${titleId}, unable to save stats.`,
      );

      return;
    }

    const propertyMappings = JSON.parse(
      readFileSync(statsConfigPath, 'utf8'),
    ).properties;

    await Promise.all(
      Object.entries(request.leaderboards).map(
        async ([leaderboardId, leaderboard]) => {
          const stats: LeaderboardUpdateProps['stats'] = {};
          Object.entries(leaderboard.stats).forEach(([propId, stat]) => {
            const propertyMapping =
              propertyMappings[new PropertyId(propId).toString()];

            if (!propertyMapping) {
              this.logger.warn('UNKNOWN STAT ID FOR PROPERTY ' + propId);
              return;
            }

            const statId = propertyMapping.statId;

            stats[`${statId}`] = {
              ...stat,
              method: propertyMapping.method,
            };
          });

          return await this.commandBus.execute(
            new UpdateLeaderboardCommand(
              new LeaderboardId(leaderboardId),
              new TitleId(titleId),
              new Xuid(request.xuid),
              stats,
            ),
          );
        },
      ),
    );
  }
}
