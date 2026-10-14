import { WriteStatsDto } from 'src/infrastructure/persistance/dtos/WriteStatsDto';

export class WriteStatsCommand {
  constructor(public readonly stats: WriteStatsDto) {}
}
