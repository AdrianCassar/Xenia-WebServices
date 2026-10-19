import { WriteStatsDto } from 'src/infrastructure/persistence/dtos/WriteStatsDto';

export class WriteStatsCommand {
  constructor(public readonly stats: WriteStatsDto) {}
}
