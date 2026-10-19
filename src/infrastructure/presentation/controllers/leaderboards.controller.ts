import { Controller, Post, Body, ConsoleLogger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import {
  EnumerateLeaderboardsDto,
  EstimateRankDto,
  ReadLeaderboardsDto,
} from 'src/infrastructure/persistence/dtos/ReadLeaderboardsDto';
import {
  EstimateRankResponseDto,
  LeaderboardsResponseDto,
} from 'src/infrastructure/persistence/dtos/LeaderboardsResponseDto';
import { ReadLeaderboardsQuery } from 'src/application/queries/ReadLeaderboardsQuery';
import { EnumerateLeaderboardsQuery } from 'src/application/queries/EnumerateLeaderboardsQuery';
import { EstimateRankQuery } from 'src/application/queries/EstimateRankQuery';

@ApiTags('Leaderboard')
@Controller('/leaderboards')
export class LeaderboardsController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext(LeaderboardsController.name);
  }

  // XUserReadStats
  @Post('/find')
  async readStats(
    @Body() request: ReadLeaderboardsDto,
  ): Promise<LeaderboardsResponseDto> {
    return await this.queryBus.execute(new ReadLeaderboardsQuery(request));
  }

  // XUserCreateStatsEnumeratorByXuid/ByRank/ByRating
  @Post('/enumerate')
  async enumerateStats(
    @Body() request: EnumerateLeaderboardsDto,
  ): Promise<LeaderboardsResponseDto> {
    return await this.queryBus.execute(new EnumerateLeaderboardsQuery(request));
  }

  // XUserEstimateRankForRating
  @Post('/estimate-rank')
  async estimateRank(
    @Body() request: EstimateRankDto,
  ): Promise<EstimateRankResponseDto> {
    return await this.queryBus.execute(new EstimateRankQuery(request));
  }
}
