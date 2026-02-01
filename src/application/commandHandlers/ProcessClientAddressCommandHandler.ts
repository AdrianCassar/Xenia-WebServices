import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { ProcessClientAddressCommand } from '../commands/ProcessClientAddressCommand';
import ipaddr from 'ipaddr.js';
import { ConsoleLogger } from '@nestjs/common';

@CommandHandler(ProcessClientAddressCommand)
export class ProcessClientAddressCommandHandler implements ICommandHandler<ProcessClientAddressCommand> {
  constructor(private readonly logger: ConsoleLogger) {
    logger.setContext(ProcessClientAddressCommand.name);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(command: ProcessClientAddressCommand) {
    // Must trim ::ffff: from private IPs because session hostAddress is not in IPv6 format.
    const IP = ipaddr.process(command.ip);
    const IP_address = IP.toString();

    this.logger.debug(`Client IP Range: ${IP.range()}`);

    return IP_address;
  }
}
