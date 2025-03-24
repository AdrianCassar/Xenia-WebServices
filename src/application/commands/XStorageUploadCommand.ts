import { RawBodyRequest } from '@nestjs/common/interfaces/http/raw-body-request.interface';

export class XStorageUploadCommand {
  constructor(
    public readonly path: string,
    public readonly buffer_size_limit: number,
    public readonly buffer: RawBodyRequest<Buffer>,
  ) {}
}
