import {
  Controller,
  Get,
  Delete,
  Inject,
  NotFoundException,
  Param,
  Put,
  RawBodyRequest,
  StreamableFile,
  Ip,
} from '@nestjs/common';
import * as rawbody from 'raw-body';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import TitleId from 'src/domain/value-objects/TitleId';
import { Body, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common/decorators';
import { CreateSessionRequest } from '../requests/CreateSessionRequest';
import { CreateSessionCommand } from 'src/application/commands/CreateSessionCommand';
import SessionId from 'src/domain/value-objects/SessionId';
import IpAddress from 'src/domain/value-objects/IpAddress';
import SessionFlags, { Flags } from 'src/domain/value-objects/SessionFlags';
import { GetSessionQuery } from 'src/application/queries/GetSessionQuery';
import { SessionSearchQuery } from 'src/application/queries/SessionSearchQuery';
import SessionPresentationMapper from '../mappers/SessionPresentationMapper';
import MacAddress from 'src/domain/value-objects/MacAddress';
import { ModifySessionCommand } from 'src/application/commands/ModifySessionCommand';
import { ModifySessionRequest } from '../requests/ModifySessionRequest';
import { JoinSessionCommand } from 'src/application/commands/JoinSessionCommand';
import { JoinSessionRequest } from '../requests/JoinSessionRequest';
import { GetSessionContextRequest } from '../requests/GetSessionContextRequest';
import Xuid from 'src/domain/value-objects/Xuid';
import { SessionSearchRequest } from '../requests/SessionSearchRequest';
import { SessionDetailsResponse } from '../responses/SessionDetailsResponse';
import { LeaveSessionRequest } from '../requests/LeaveSessionRequest';
import { LeaveSessionCommand } from 'src/application/commands/LeaveSessionCommand';
import { DeleteSessionCommand } from 'src/application/commands/DeleteSessionCommand';
import { AddSessionContextCommand } from 'src/application/commands/AddSessionContextCommand';
import { SessionArbitrationResponse } from '../responses/SessionArbitrationResponse';
import { SessionContextResponse } from '../responses/SessionContextResponse';
import Player from 'src/domain/aggregates/Player';
import { GetPlayerQuery } from 'src/application/queries/GetPlayerQuery';
import { FindPlayerQuery } from 'src/application/queries/FindPlayerQuery';
import { SetPlayerSessionIdCommand } from 'src/application/commands/SetPlayerSessionIdCommand';
import Session from 'src/domain/aggregates/Session';
import { Request, Response } from 'express';
import { readFile, mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readFileSync, createReadStream } from 'fs';
import { UpdateLeaderboardCommand } from 'src/application/commands/UpdateLeaderboardCommand';
import LeaderboardId from 'src/domain/value-objects/LeaderboardId';
import { WriteStatsRequest } from '../requests/WriteStatsRequest';
import LeaderboardStatId from 'src/domain/value-objects/LeaderboardStatId';
import PropertyId from 'src/domain/value-objects/PropertyId';
import Leaderboard, { LeaderboardUpdateProps } from 'src/domain/aggregates/Leaderboard';
import { FindPlayerSessionQuery } from 'src/application/queries/FindPlayerSessionQuery';
import axios from 'axios';
import { MigrateSessionCommand } from 'src/application/commands/MigrateSessionCommand';
import { MigrateSessionRequest } from '../requests/MigrateSessionRequest';
import { RealIP } from 'nestjs-real-ip';

@ApiTags('Sessions')
@Controller('/title/:titleId/sessions')
export class SessionController {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly sessionMapper: SessionPresentationMapper,
  ) {}

  @Post()
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  async createSession(
    @Param('titleId') titleId: string,
    @Body() request: CreateSessionRequest,
  ) {
    const flags = new SessionFlags(request.flags);
    let session: Session;

    if (flags.isHost || flags.value == Flags.STATS) {
      console.log('Host creating session: ' + request.sessionId);

      session = await this.commandBus.execute(
        new CreateSessionCommand(
          new TitleId(titleId),
          new SessionId(request.sessionId),
          new IpAddress(request.hostAddress),
          new SessionFlags(request.flags),
          request.publicSlotsCount,
          request.privateSlotsCount,
          new MacAddress(request.macAddress),
          request.port,
        ),
      );

      if (flags.value == Flags.STATS) {
        console.log("Updating Stats.")
      }
  
      if (flags.value == Flags.STATS + Flags.HOST) {
        console.log("Updating Stats.")
      }
      
      try {
        const player = await this.queryBus.execute(new FindPlayerQuery(new IpAddress(request.hostAddress)));
        await this.commandBus.execute(new SetPlayerSessionIdCommand(player.xuid, new SessionId(request.sessionId)));
      } catch (error) {
        console.log("BAD PLAYER " + request.hostAddress);
        console.log(session);
      }
    } else {
      console.log('Peer joining session ' + request.sessionId);

      var sessionQuery = new GetSessionQuery(
        new TitleId(titleId),
        new SessionId(request.sessionId),
      );

      console.log(sessionQuery);

      session = await this.queryBus.execute(sessionQuery);
    }
  }

  @Get('/:sessionId')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async getSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    return this.sessionMapper.mapToPresentationModel(session);
  }

  @Post('/:sessionId/migrate')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async migrateSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: MigrateSessionRequest,
  ) {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    const newSession = await this.commandBus.execute(
      new MigrateSessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        new IpAddress(request.hostAddress),
        new MacAddress(request.macAddress),
        request.port,
      ),
    );

    return this.sessionMapper.mapToPresentationModel(newSession);
  }

  @Delete('/:sessionId')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async deleteSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @RealIP() ip: string,
  ) {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    const splitIp = ip.split(':');
    let ipv4 = splitIp[splitIp.length - 1];

    if (ipv4 == "127.0.0.1" || ipv4.startsWith("192.168") || ipv4.split(".")[0] == "10") {
      // Hi me! Who are you?
      const res = await axios.get("https://api.ipify.org/");
      ipv4 = res.data;
    }

    if (session) {
      console.log("Host Address: " + session.hostAddress.value);
      console.log("IPV4 Address: " + ipv4);
    } else {
      console.log("Session already deleted? " + ipv4);
      console.log(session);
    }
    
    if (session == undefined || session.hostAddress.value !== ipv4) return;

    await this.commandBus.execute(
      new DeleteSessionCommand(new TitleId(titleId), new SessionId(sessionId)),
    );
  }

  // 🌈🌈🌈 This fabulous function is here to slay! Yasss queen! 💅💅💅
  @Get('/:sessionId/details')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async getSessionDetails(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionDetailsResponse> {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    // TODO: I think there should be more in here but I haven't worked it out yet.
    // Also, the host flag should probably be unset if requested by a peer.
    return {
      id: session.id.value,
      flags: session.flags.value,
      hostAddress: session.hostAddress.value,
      port: session.port,
      macAddress: session.macAddress.value,
      publicSlotsCount: session.publicSlotsCount,
      privateSlotsCount: session.privateSlotsCount,
      openPublicSlotsCount: session.openPublicSlots,
      openPrivateSlotsCount: session.openPrivateSlots,
      filledPublicSlotsCount: session.filledPublicSlots,
      filledPrivateSlotsCount: session.filledPrivateSlots,
      players: session.players.map((xuid) => ({ xuid: xuid.value })),
    };
  }

  @Get('/:sessionId/arbitration')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async getSessionArbitration(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionArbitrationResponse> {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    const players: Player[] = await Promise.all(
      session.players.map((xuid) => {
        return this.queryBus.execute(new GetPlayerQuery(xuid));
      }
    ));

    const machinePlayers = {};
    players.filter((player) => player != undefined).forEach((player) => {
      if (machinePlayers[player.machineId.value] !== undefined)
        machinePlayers[player.machineId.value].push(player);
      else
        machinePlayers[player.machineId.value] = [player];
    });

    const machines: SessionArbitrationResponse['machines'] = [];

    for (const [key, value] of Object.entries(machinePlayers)) {
      machines.push({
        id: key,
        players: (value as Player[]).map((player: Player) => {
          return { xuid: player.xuid.value }
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
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async modifySession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: ModifySessionRequest,
  ) {
    await this.commandBus.execute(
      new ModifySessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        new SessionFlags(request.flags),
        request.publicSlotsCount,
        request.privateSlotsCount,
      ),
    );
  }

  @Post('/:sessionId/join')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async joinSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: JoinSessionRequest,
  ) {
    await this.commandBus.execute(
      new JoinSessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        request.xuids.map((xuid) => new Xuid(xuid)),
      ),
    );
  }

  @Post('/:sessionId/leave')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async leaveSession(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: LeaveSessionRequest,
  ) {
    await this.commandBus.execute(
      new LeaveSessionCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        request.xuids.map((xuid) => new Xuid(xuid)),
      ),
    );
  }

  @Post('/search')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  async sessionSearch(
    @Param('titleId') titleId: string,
    @Body() request: SessionSearchRequest,
  ) {
    const sessions = await this.queryBus.execute(
      new SessionSearchQuery(
        new TitleId(titleId),
        request.searchIndex,
        request.resultsCount,
      ),
    );

    return sessions.map(this.sessionMapper.mapToPresentationModel);
  }

  @Post('/:sessionId/qos')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async qosUpload(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const qosPath = join(process.cwd(), 'qos', titleId, sessionId);

    if (existsSync(qosPath)) {
      console.log("Updating QoS Data.");
    } else {
      await mkdir(join(process.cwd(), 'qos', titleId), { recursive: true });
      console.log("Saving QoS Data.");
    }

    // always write QoS data to ensure data is updated.
    await writeFile(qosPath, req.rawBody);
  }

  @Get('/:sessionId/qos')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async qosDownload(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const path = join(process.cwd(), 'qos', titleId, sessionId);

    if (!existsSync(path)) {
      res.set('Content-Length', '0');
      res.sendStatus(204);
      return;
    }

    const stats = await stat(path);

    if (!stats.isFile()) throw new NotFoundException();
    res.set('Content-Length', stats.size.toString());
    const stream = createReadStream(path);
    stream.pipe(res);
  }

  @Post('/:sessionId/context')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async sessionContextSet(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: GetSessionContextRequest,
  ) {
    await this.commandBus.execute(
      new AddSessionContextCommand(
        new TitleId(titleId),
        new SessionId(sessionId),
        request.contexts
      ),
    );
  }

  @Get('/:sessionId/context')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async sessionContextGet(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionContextResponse> {
    const session = await this.queryBus.execute(
      new GetSessionQuery(new TitleId(titleId), new SessionId(sessionId)),
    );

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    return {
      context: session.context,
    };
  }

  @Post('/:sessionId/leaderboards')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'sessionId', example: 'B36B3FE8467CFAC7' })
  async postLeaderboards(
    @Param('titleId') titleId: string,
    @Param('sessionId') sessionId: string,
    @Body() request: WriteStatsRequest,
  ) {
    console.log({request: JSON.stringify(request)})

    const statsConfigPath = join(
      process.cwd(),
      'titles',
      titleId.toUpperCase(),
      'stats.json',
    );

    // lol
    const statsConfigStats = await stat(statsConfigPath);

    if (!statsConfigStats.isFile()) {
      console.warn(
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

            if (propertyMapping == undefined) {
              console.warn('UNKNOWN STAT ID FOR PROPERTY ' + propId);
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
