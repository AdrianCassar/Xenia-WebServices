import {
  Body,
  ConsoleLogger,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import path, { join, normalize } from 'path';
import fg, { Entry } from 'fast-glob';
import PersistanceSettings from 'src/infrastructure/persistance/settings/PersistanceSettings';
import { XStorageUploadCommand } from 'src/application/commands/XStorageUploadCommand';
import { XStorageDownloadCommand } from 'src/application/commands/XStorageDownloadCommand';
import { XStorageDeleteCommand } from 'src/application/commands/XStorageDeleteCommand';
import { XStorageBuildServerPathCommand } from 'src/application/commands/XStorageBuildServerPathCommand';
import {
  X_STORAGE_FILE_INFO,
  XStorageEnumerateResponse,
} from '../responses/XStorageFileInfoResponse';
import { XStorageEnumerateRequest } from '../requests/XStorageEnumerateRequest';
import { BuildServerPathState } from 'src/application/commandHandlers/XStorageBuildServerPathCommandHandler';
import { UploadState } from 'src/application/commandHandlers/XStorageUploadCommandHandler';

// MS Docs for modern XStorage
// https://github.com/MicrosoftDocs/xbox-live-docs/blob/docs/xbox-live-docs-pr/features/cloud-storage/title-storage/how-to/live-title-storage-howto-nav.md

/**
curl user tests:

Delete:
curl -X DELETE http://127.0.0.1:36000/xstorage/user/0009000000000000/title/41560817/storage/mpdata

Download:
curl http://127.0.0.1:36000/xstorage/user/0009000000000000/title/41560817/storage/mpdata -O

Upload:
curl -i -X POST http://127.0.0.1:36000/xstorage/user/0009000000000000/title/41560817/storage/mpdata --data-binary "@C:\...\Xenia-WebServices\src\xstorage\user\0009000000000000\title\41560817\storage\mpdata"
**/

@ApiTags('XStorage')
@Controller('xstorage')
export class XStorageController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext(XStorageController.name);
  }

  envs = new PersistanceSettings().get();

  user_file_size_limit: number = 8192; // 8 KB
  title_file_size_limit: number = 5242880; // 5 MB
  clip_file_size_limit: number = 11534336; // 11 MB

  xstorage_root: string = normalize('./src/xstorage');

  SanitizePath(path: string) {
    let new_path = path.replace('\\', '/').replace('../', '');

    if (
      path == '**' ||
      path == '*' ||
      path == './*' ||
      path == './**' ||
      path == '/**'
    ) {
      new_path = '/title/*';
    }

    const safe_path = join(this.xstorage_root, normalize(new_path));

    if (!safe_path.startsWith(this.xstorage_root)) {
      return join(this.xstorage_root, 'title');
    }

    return safe_path;
  }

  @Post('/title/:titleId/storage/clips')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  async XStorageBuildServerPathClip(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
  ): Promise<number> {
    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/user/${xuid}/title/${titleId}/storage/clips`;
    const absolute_path = this.SanitizePath(location);

    const result: BuildServerPathState = await this.commandBus.execute(
      new XStorageBuildServerPathCommand(absolute_path),
    );

    switch (result) {
      case BuildServerPathState.Created:
        this.logger.verbose(`Built clips path: ${absolute_path}`);
        break;
      case BuildServerPathState.Found:
        this.logger.verbose(`Found clips path: ${absolute_path}`);
        break;
      case BuildServerPathState.Error:
        this.logger.error(`Failed to build clips path: ${absolute_path}`);
        break;
    }

    return result;
  }

  @Post('/title/:titleId/storage/clips/:file')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'mpdata',
  })
  async XStorageUploadClip(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
    @Param('file') file: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<number> {
    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/user/${xuid}/title/${titleId}/storage/clips/${file}`;
    const absolute_path = this.SanitizePath(location);

    const result: UploadState = await this.commandBus.execute(
      new XStorageUploadCommand(
        absolute_path,
        this.clip_file_size_limit,
        req.rawBody,
      ),
    );

    switch (result) {
      case UploadState.Uploaded:
        this.logger.verbose(
          `Uploaded clip: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
      case UploadState.Not_Modified:
        this.logger.verbose(
          `Uploaded clip - NOT MODIFIED: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
      case UploadState.Error:
        this.logger.error(
          `Error uploading clip: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
    }

    return result;
  }

  @Get('/title/:titleId/storage/clips/:file')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'mpdata',
  })
  async XStorageDownloadClip(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    const location = `/user/${xuid}/title/${titleId}/storage/clips/${file}`;
    const absolute_path = this.SanitizePath(location);

    const downloaded: boolean = await this.commandBus.execute(
      new XStorageDownloadCommand(
        absolute_path,
        this.clip_file_size_limit,
        res,
      ),
    );

    if (downloaded) {
      this.logger.verbose(
        `Downloaded clip: ${location} of size ${res.get('Content-Length')}b`,
      );
    }
  }

  @Delete('/title/:titleId/storage/clips/:file')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'mpdata',
  })
  async XStorageDeleteClip(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
    @Param('file') file: string,
  ) {
    throw new ForbiddenException('Deleting clip content is not allowed!');

    const absolute_path = join(
      this.xstorage_root,
      `/user/${xuid}/title/${titleId}/storage/clips/${file}`,
    );

    await this.commandBus.execute(new XStorageDeleteCommand(absolute_path));
  }

  @Post('/user/:xuid/title/:titleId/storage')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  async XStorageBuildServerPathUser(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
  ): Promise<number> {
    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/user/${xuid}/title/${titleId}/storage`;
    const absolute_path = this.SanitizePath(location);

    const result: BuildServerPathState = await this.commandBus.execute(
      new XStorageBuildServerPathCommand(absolute_path),
    );

    switch (result) {
      case BuildServerPathState.Created:
        this.logger.verbose(`Built user path: ${absolute_path}`);
        break;
      case BuildServerPathState.Found:
        this.logger.verbose(`Found user path: ${absolute_path}`);
        break;
      case BuildServerPathState.Error:
        this.logger.error(`Failed to build user path: ${absolute_path}`);
        break;
    }

    return result;
  }

  @Post('/user/:xuid/title/:titleId/storage/:file')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'mpdata',
  })
  async XStorageUploadUser(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
    @Param('file') file: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<number> {
    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/user/${xuid}/title/${titleId}/storage/${file}`;
    const absolute_path = this.SanitizePath(location);

    const result: UploadState = await this.commandBus.execute(
      new XStorageUploadCommand(
        absolute_path,
        this.user_file_size_limit,
        req.rawBody,
      ),
    );

    switch (result) {
      case UploadState.Uploaded:
        this.logger.verbose(
          `Uploaded file: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
      case UploadState.Not_Modified:
        this.logger.verbose(
          `Uploaded file - NOT MODIFIED: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
      case UploadState.Error:
        this.logger.error(
          `Error uploading file: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
    }

    return result;
  }

  @Get('/user/:xuid/title/:titleId/storage/:file')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'mpdata',
  })
  async XStorageDownloadUser(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    const location = `/user/${xuid}/title/${titleId}/storage/${file}`;
    const absolute_path = this.SanitizePath(location);

    const downloaded: boolean = await this.commandBus.execute(
      new XStorageDownloadCommand(
        absolute_path,
        this.user_file_size_limit,
        res,
      ),
    );

    if (downloaded) {
      this.logger.verbose(
        `Downloaded file: ${location} of size ${res.get('Content-Length')}b`,
      );
    }
  }

  @Delete('/user/:xuid/title/:titleId/storage/:file')
  @ApiParam({
    name: 'xuid',
    example: '0009000000000000',
  })
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'mpdata',
  })
  async XStorageDeleteUser(
    @Param('xuid') xuid: string,
    @Param('titleId') titleId: string,
    @Param('file') file: string,
  ) {
    const absolute_path = join(
      this.xstorage_root,
      `/user/${xuid}/title/${titleId}/storage/${file}`,
    );

    await this.commandBus.execute(new XStorageDeleteCommand(absolute_path));
  }

  @Post('/title/:titleId/storage')
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  async XStorageBuildServerPathTitle(
    @Param('titleId') titleId: string,
  ): Promise<number> {
    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/title/${titleId}/storage`;
    const absolute_path = this.SanitizePath(location);

    const result: BuildServerPathState = await this.commandBus.execute(
      new XStorageBuildServerPathCommand(absolute_path),
    );

    switch (result) {
      case BuildServerPathState.Created:
        this.logger.verbose(`Built title path: ${absolute_path}`);
        break;
      case BuildServerPathState.Found:
        this.logger.verbose(`Found title path: ${absolute_path}`);
        break;
      case BuildServerPathState.Error:
        this.logger.error(`Failed to build title path: ${absolute_path}`);
        break;
    }

    return result;
  }

  @Post('/title/:titleId/storage/:file')
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'playlists',
  })
  async XStorageUploadTitle(
    @Param('titleId') titleId: string,
    @Param('file') file: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<number> {
    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/title/${titleId}/storage/${file}`;
    const absolute_path = this.SanitizePath(location);

    const result: UploadState = await this.commandBus.execute(
      new XStorageUploadCommand(
        absolute_path,
        this.title_file_size_limit,
        req.rawBody,
      ),
    );

    switch (result) {
      case UploadState.Uploaded:
        this.logger.verbose(
          `Uploaded file: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
      case UploadState.Not_Modified:
        this.logger.verbose(
          `Uploaded file - NOT MODIFIED: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
      case UploadState.Error:
        this.logger.error(
          `Error uploading file: ${location} of size ${req.rawBody.byteLength}b`,
        );
        break;
    }

    return result;
  }

  @Get('/title/:titleId/storage/:file')
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'playlists',
  })
  async XStorageDownloadTitle(
    @Param('titleId') titleId: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    const location = `/title/${titleId}/storage/${file}`;
    const absolute_path = this.SanitizePath(location);

    await this.commandBus.execute(
      new XStorageDownloadCommand(
        absolute_path,
        this.title_file_size_limit,
        res,
      ),
    );
  }

  @Delete('/title/:titleId/storage/:file')
  @ApiParam({
    name: 'titleId',
    example: '41560817',
  })
  @ApiParam({
    name: 'file',
    example: 'playlists',
  })
  async XStorageDeleteTitle(
    @Param('titleId') titleId: string,
    @Param('file') file: string,
  ) {
    throw new ForbiddenException('Deleting title content is not allowed!');

    if (this.envs.xstorage == 'false') {
      throw new ForbiddenException('XStorage support is disabled on backend!');
    }

    const location = `/title/${titleId}/storage/${file}`;
    const absolute_path = this.SanitizePath(location);

    await this.commandBus.execute(new XStorageDeleteCommand(absolute_path));
  }

  @Post('/enumerate/:directory')
  @ApiParam({
    name: 'directory',
    example: 'user/0009000000000000/title/41560817/storage/',
  })
  async XStorageEnumerate(
    @Param('directory') directory: string,
    @Body() request: XStorageEnumerateRequest,
  ): Promise<XStorageEnumerateResponse> {
    const location = `${directory}`;
    const absolute_path = this.SanitizePath(location);
    const posix_absolute_path = absolute_path.replaceAll(
      path.sep,
      path.posix.sep,
    );

    const title_id = this.GetTitleIDFromPath(posix_absolute_path);
    const xuid = this.GetXUIDFromPath(posix_absolute_path);
    const total_num_items = await this.GetTotalFilesCount(posix_absolute_path);

    // Do not allow user/* enumeration
    if (isNaN(xuid)) {
      const empty_response: XStorageEnumerateResponse = {
        items: [],
        total_num_items: 0,
      };

      return empty_response;
    }

    let items = await fg(`${posix_absolute_path}`, {
      onlyFiles: true,
      stats: true,
    });

    // Limit returned items
    items = items.slice(0, request.MaxItems);

    const sort_last_modified = items.sort(
      (a, b) => a.stats.mtimeMs - b.stats.mtimeMs,
    );

    const enumerated_files: Array<X_STORAGE_FILE_INFO> = [];

    sort_last_modified.forEach((entity: Entry) => {
      // Support title/*/storage/*
      const title_id_value = isNaN(title_id)
        ? this.GetTitleIDFromPath(entity.path)
        : title_id;

      const item_details: X_STORAGE_FILE_INFO = {
        title_id: title_id_value,
        title_version: 0,
        owner_puid: xuid,
        country_id: 0,
        content_type: 0,
        storage_size: entity.stats.size,
        installed_size: entity.stats.size,
        created: this.UnixToFileTime(entity.stats.birthtimeMs),
        last_modified: this.UnixToFileTime(entity.stats.mtimeMs),
        path: entity.path.substring('src/'.length, entity.path.length),
      };

      enumerated_files.push(item_details);
    });

    const enumerate_response: XStorageEnumerateResponse = {
      items: enumerated_files,
      total_num_items: total_num_items,
    };

    return enumerate_response;
  }

  // Enumerate Helpers

  GetTitleIDFromPath(path: string): number {
    const title_pos: number = path.indexOf('title/');

    let title_id = 0;

    if (title_pos != -1) {
      const offset = title_pos + 'title/'.length;
      const title_id_length = 8;
      const title_id_str = path.substring(offset, offset + title_id_length);

      title_id = Number(`0x${title_id_str}`);
    }

    return title_id;
  }

  GetXUIDFromPath(path: string): number {
    const xuid_pos: number = path.indexOf('user/');

    let xuid = 0;

    if (xuid_pos != -1) {
      const offset = xuid_pos + 'user/'.length;
      const xuid_length = 16;
      const xuid_str = path.substring(offset, offset + xuid_length);

      xuid = Number(`0x${xuid_str}`);
    }

    return xuid;
  }

  async GetTotalFilesCount(file_path: string): Promise<number> {
    const parent_path = path.dirname(file_path);
    let absolute_path_query_all = `${parent_path}/*`;

    if (path.basename(file_path) == 'storage') {
      let pattern = '/*';

      if (file_path.endsWith('/')) {
        pattern = '*';
      }

      absolute_path_query_all = `${file_path}${pattern}`;
    }

    const total_num_items = (
      await fg(`${absolute_path_query_all}`, {
        onlyFiles: true,
        deep: 0,
      })
    ).length;

    return total_num_items;
  }

  UnixToFileTime(timeMs: number): number {
    const EPOCH_DIFFERENCE_MS = 11644473600000; // Difference between 1601-01-01 and 1970-01-01 in milliseconds
    const MS_TO_100NS = 10000; // Convert milliseconds to 100-nanosecond units

    return (timeMs + EPOCH_DIFFERENCE_MS) * MS_TO_100NS;
  }
}
