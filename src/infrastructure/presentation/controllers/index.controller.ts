import { Controller, Get, Header, ConsoleLogger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AggregateSessionCommand } from 'src/application/commands/AggregateSessionCommand';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Index')
@Controller()
export class IndexController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext(IndexController.name);
  }

  @Get('/sessions')
  @Header('content-type', 'application/json')
  async sessionData() {
    const sessionsJSON: string = await this.commandBus.execute(
      new AggregateSessionCommand(),
    );

    return sessionsJSON;
  }
}
