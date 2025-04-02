import { Response } from 'express';

export class XStorageDownloadCommand {
  constructor(
    public readonly path: string,
    public readonly buffer_size_limit: number,
    public readonly response: Response,
  ) {}
}
