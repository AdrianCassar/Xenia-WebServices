import {
  ConsoleLogger,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { join, normalize } from 'path';
import { readFile, writeFile, mkdir, readdir, stat, unlink, appendFile, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('/services')
export class TitleStorageController {
  constructor(private readonly logger: ConsoleLogger) {
    this.logger.setContext(TitleStorageController.name);
  }

  private readonly storageRoot = normalize('./src/titlestorage');
  private readonly maxBlobSize = 0x500000; // 5MB

  private extractXuid(xuidPart: string): string {
    const m = xuidPart.match(/xuid\((\d+)\)/);
    return m ? m[1] : xuidPart.replace(/[^0-9]/g, '');
  }

  private extractPath(params: any): string {
    const p = params.path;
    if (Array.isArray(p)) return p.join('/');
    return typeof p === 'string' ? p : '';
  }

  private isListing(path: string): boolean {
    return !path || path === '/' || path === '\\' || path === '%5C' || path === '%2F';
  }

  private normalizeFilename(filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._,-]/g, '');
    const commaIdx = safe.lastIndexOf(',');
    if (commaIdx < 0) return safe;
    const base = safe.substring(0, commaIdx);
    const type = safe.substring(commaIdx + 1);
    if (base.includes('.')) return base;
    if (type === 'binary') return `${base}.bin`;
    if (type === 'json') return `${base}.json`;
    return `${base}.${type}`;
  }

  private toXblFilename(file: string): string {
    if (file.endsWith('.json')) return file.slice(0, -5) + ',json';
    if (file.endsWith('.bin')) return file.slice(0, -4) + ',binary';
    return `${file},binary`;
  }

  private sanitizePath(xuid: string, guid: string, filename: string) {
    const safeXuid = xuid.replace(/[^0-9]/g, '');
    const safeGuid = guid.replace(/[^0-9a-fA-F-]/g, '');
    const safeFile = this.normalizeFilename(filename);
    const dir = join(this.storageRoot, safeXuid, safeGuid);
    const fp = join(dir, safeFile);
    const root = normalize(this.storageRoot);
    const norm = normalize(fp);
    if (!norm.startsWith(root)) return join(root, 'default');
    return norm;
  }

  private unixToFileTime(ms: number) {
    return (ms + 11644473600000) * 10000;
  }


  @Get('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data')
  async getUsersListing(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const guid = req.params.guid;
    try {
      const safeXuid = xuid.replace(/[^0-9]/g, '');
      const safeGuid = guid.replace(/[^0-9a-fA-F-]/g, '');
      const dir = join(this.storageRoot, safeXuid, safeGuid);

      let blobs: any[] = [];
      if (existsSync(dir)) {
        for (const file of await readdir(dir)) {
          const fp = join(dir, file);
          const s = await stat(fp);
          if (s.isFile()) {
            const xblName = this.toXblFilename(file);
            blobs.push({
              fileName: xblName,
              clientFileTime: this.unixToFileTime(s.mtimeMs),
              etag: `"${s.size}-${s.mtimeMs}"`,
              size: s.size,
            });
          }
        }
      }

      const skip = parseInt(req.query.skipItems as string) || 0;
      const max = parseInt(req.query.maxItems as string) || 100;
      const total = blobs.length;
      blobs = blobs.slice(skip, skip + max);

      const body = JSON.stringify({
        blobs,
        pagingInfo: { totalItems: total, continuationToken: null },
      });
      res.set('Content-Type', 'application/json');
      res.set('x-xbl-contract-version', '1');
      res.set('ETag', `"list-${total}"`);
      res.set('Content-Length', Buffer.byteLength(body).toString());
      this.logger.log(`LIST xuid=${xuid} guid=${guid} blobs=${blobs.length}/${total}`);
      return res.status(200).send(body);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Get('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data/*path')
  async getUsersFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return this.getUsersListing(req, res);
    try {
      const fp = this.sanitizePath(xuid, guid, filename);
      if (!existsSync(fp)) {
        this.logger.log(`GET xuid=${xuid} guid=${guid} file="${filename}" -> 404`);
        return res.status(404).send();
      }
      const s = await stat(fp);
      const data = await readFile(fp);
      res.set('ETag', `"${s.size}-${s.mtimeMs}"`);
      res.set('Content-Length', s.size.toString());
      res.set('Content-Type', 'application/octet-stream');
      this.logger.log(`GET xuid=${xuid} guid=${guid} file="${filename}" size=${s.size}`);
      return res.status(200).send(data);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Post('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data')
  async postUsersListing(@Req() req: Request, @Res() res: Response) { return res.status(400).send(); }

  @Post('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data/*path')
  async postUsersFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return res.status(400).send();
    try {
      const fp = this.sanitizePath(xuid, guid, filename);
      const dir = join(fp, '..');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);

      if (body.length > this.maxBlobSize) {
        this.logger.error(`File too large: ${body.length}`);
        return res.status(413).send();
      }

      const hasFinalBlock = req.query.finalBlock !== undefined;
      const finalBlock = req.query.finalBlock === 'true' || req.query.finalBlock === ('true' as any);
      const continuationToken = req.query.continuationToken as string;
      const isSingleMessage = !hasFinalBlock;

      if (isSingleMessage || finalBlock) {
        if (continuationToken && existsSync(fp + '.tmp')) {
          await appendFile(fp + '.tmp', body);
          await rename(fp + '.tmp', fp);
        } else {
          await writeFile(fp, body);
        }
        const s = await stat(fp);
        const etag = `"${s.size}-${s.mtimeMs}"`;
        this.logger.log(`PUT xuid=${xuid} guid=${guid} file="${filename}" size=${s.size} ${isSingleMessage ? 'single' : 'final'}=true -> 201`);
        res.set('ETag', etag);
        const respBody = JSON.stringify({ continuationToken: null });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(201).send(respBody);
      } else {
        const tmpPath = fp + '.tmp';
        if (continuationToken && existsSync(tmpPath)) {
          await appendFile(tmpPath, body);
        } else {
          await writeFile(tmpPath, body);
        }
        this.logger.log(`PUT xuid=${xuid} guid=${guid} file="${filename}" block=${body.length} final=false -> 200`);
        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const respBody = JSON.stringify({ continuationToken: token });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(200).send(respBody);
      }
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Put('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data')
  async putUsersListing(@Req() req: Request, @Res() res: Response) { return res.status(400).send(); }

  @Put('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data/*path')
  async putUsersFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return res.status(400).send();
    try {
      const fp = this.sanitizePath(xuid, guid, filename);
      const dir = join(fp, '..');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);

      if (body.length > this.maxBlobSize) {
        this.logger.error(`File too large: ${body.length}`);
        return res.status(413).send();
      }

      const hasFinalBlock = req.query.finalBlock !== undefined;
      const finalBlock = req.query.finalBlock === 'true' || req.query.finalBlock === ('true' as any);
      const continuationToken = req.query.continuationToken as string;
      const isSingleMessage = !hasFinalBlock;

      if (isSingleMessage || finalBlock) {
        if (continuationToken && existsSync(fp + '.tmp')) {
          await appendFile(fp + '.tmp', body);
          await rename(fp + '.tmp', fp);
        } else {
          await writeFile(fp, body);
        }
        const s = await stat(fp);
        const etag = `"${s.size}-${s.mtimeMs}"`;
        this.logger.log(`PUT xuid=${xuid} guid=${guid} file="${filename}" size=${s.size} ${isSingleMessage ? 'single' : 'final'}=true -> 201`);
        res.set('ETag', etag);
        const respBody = JSON.stringify({ continuationToken: null });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(201).send(respBody);
      } else {
        const tmpPath = fp + '.tmp';
        if (continuationToken && existsSync(tmpPath)) {
          await appendFile(tmpPath, body);
        } else {
          await writeFile(tmpPath, body);
        }
        this.logger.log(`PUT xuid=${xuid} guid=${guid} file="${filename}" block=${body.length} final=false -> 200`);
        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const respBody = JSON.stringify({ continuationToken: token });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(200).send(respBody);
      }
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Delete('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data')
  async deleteUsersListing(@Req() req: Request, @Res() res: Response) { return res.status(400).send(); }

  @Delete('users/:xuidPart/storage/titlestorage/titlegroups/:guid/data/*path')
  async deleteUsersFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return res.status(400).send();
    try {
      const fp = this.sanitizePath(xuid, guid, filename);
      if (existsSync(fp)) await unlink(fp);
      this.logger.log(`DELETE xuid=${xuid} guid=${guid} file="${filename}"`);
      return res.status(200).send();
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  // ── Media routes ─────────────────────────────────────────────────────

  @Get('media/titlegroups/:guid/storage/data')
  async getMediaListing(@Req() req: Request, @Res() res: Response) {
    const guid = req.params.guid;
    try {
      const safeGuid = guid.replace(/[^0-9a-fA-F-]/g, '');
      const dir = join(this.storageRoot, 'media', safeGuid);

      let blobs: any[] = [];
      if (existsSync(dir)) {
        for (const file of await readdir(dir)) {
          const fp = join(dir, file);
          const s = await stat(fp);
          if (s.isFile()) {
            const xblName = this.toXblFilename(file);
            blobs.push({
              fileName: xblName,
              clientFileTime: this.unixToFileTime(s.mtimeMs),
              etag: `"${s.size}-${s.mtimeMs}"`,
              size: s.size,
            });
          }
        }
      }

      const skip = parseInt(req.query.skipItems as string) || 0;
      const max = parseInt(req.query.maxItems as string) || 100;
      const total = blobs.length;
      blobs = blobs.slice(skip, skip + max);

      const body = JSON.stringify({
        blobs,
        pagingInfo: { totalItems: total, continuationToken: null },
      });
      res.set('Content-Type', 'application/json');
      res.set('x-xbl-contract-version', '1');
      res.set('ETag', `"list-${total}"`);
      res.set('Content-Length', Buffer.byteLength(body).toString());
      this.logger.log(`LIST media guid=${guid} blobs=${blobs.length}/${total}`);
      return res.status(200).send(body);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Get('media/titlegroups/:guid/storage/data/*path')
  async getMediaFile(@Req() req: Request, @Res() res: Response) {
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return this.getMediaListing(req, res);
    try {
      const fp = this.sanitizePath('media', guid, filename);
      if (!existsSync(fp)) {
        this.logger.log(`GET media guid=${guid} file="${filename}" -> 404`);
        return res.status(404).send();
      }
      const s = await stat(fp);
      const data = await readFile(fp);
      res.set('ETag', `"${s.size}-${s.mtimeMs}"`);
      res.set('Content-Length', s.size.toString());
      res.set('Content-Type', 'application/octet-stream');
      this.logger.log(`GET media guid=${guid} file="${filename}" size=${s.size}`);
      return res.status(200).send(data);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Post('media/titlegroups/:guid/storage/data')
  async postMediaListing(@Req() req: Request, @Res() res: Response) { return res.status(400).send(); }

  @Post('media/titlegroups/:guid/storage/data/*path')
  async postMediaFile(@Req() req: Request, @Res() res: Response) {
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return res.status(400).send();
    try {
      const fp = this.sanitizePath('media', guid, filename);
      const dir = join(fp, '..');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);

      if (body.length > this.maxBlobSize) {
        this.logger.error(`File too large: ${body.length}`);
        return res.status(413).send();
      }

      const hasFinalBlock = req.query.finalBlock !== undefined;
      const finalBlock = req.query.finalBlock === 'true' || req.query.finalBlock === ('true' as any);
      const continuationToken = req.query.continuationToken as string;
      const isSingleMessage = !hasFinalBlock;

      if (isSingleMessage || finalBlock) {
        if (continuationToken && existsSync(fp + '.tmp')) {
          await appendFile(fp + '.tmp', body);
          await rename(fp + '.tmp', fp);
        } else {
          await writeFile(fp, body);
        }
        const s = await stat(fp);
        const etag = `"${s.size}-${s.mtimeMs}"`;
        this.logger.log(`PUT media guid=${guid} file="${filename}" size=${s.size} ${isSingleMessage ? 'single' : 'final'}=true -> 201`);
        res.set('ETag', etag);
        const respBody = JSON.stringify({ continuationToken: null });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(201).send(respBody);
      } else {
        const tmpPath = fp + '.tmp';
        if (continuationToken && existsSync(tmpPath)) {
          await appendFile(tmpPath, body);
        } else {
          await writeFile(tmpPath, body);
        }
        this.logger.log(`PUT media guid=${guid} file="${filename}" block=${body.length} final=false -> 200`);
        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const respBody = JSON.stringify({ continuationToken: token });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(200).send(respBody);
      }
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Put('media/titlegroups/:guid/storage/data')
  async putMediaListing(@Req() req: Request, @Res() res: Response) { return res.status(400).send(); }

  @Put('media/titlegroups/:guid/storage/data/*path')
  async putMediaFile(@Req() req: Request, @Res() res: Response) {
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return res.status(400).send();
    try {
      const fp = this.sanitizePath('media', guid, filename);
      const dir = join(fp, '..');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);

      if (body.length > this.maxBlobSize) {
        this.logger.error(`File too large: ${body.length}`);
        return res.status(413).send();
      }

      const hasFinalBlock = req.query.finalBlock !== undefined;
      const finalBlock = req.query.finalBlock === 'true' || req.query.finalBlock === ('true' as any);
      const continuationToken = req.query.continuationToken as string;
      const isSingleMessage = !hasFinalBlock;

      if (isSingleMessage || finalBlock) {
        if (continuationToken && existsSync(fp + '.tmp')) {
          await appendFile(fp + '.tmp', body);
          await rename(fp + '.tmp', fp);
        } else {
          await writeFile(fp, body);
        }
        const s = await stat(fp);
        const etag = `"${s.size}-${s.mtimeMs}"`;
        this.logger.log(`PUT media guid=${guid} file="${filename}" size=${s.size} ${isSingleMessage ? 'single' : 'final'}=true -> 201`);
        res.set('ETag', etag);
        const respBody = JSON.stringify({ continuationToken: null });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(201).send(respBody);
      } else {
        const tmpPath = fp + '.tmp';
        if (continuationToken && existsSync(tmpPath)) {
          await appendFile(tmpPath, body);
        } else {
          await writeFile(tmpPath, body);
        }
        this.logger.log(`PUT media guid=${guid} file="${filename}" block=${body.length} final=false -> 200`);
        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const respBody = JSON.stringify({ continuationToken: token });
        res.set('Content-Type', 'application/json');
        res.set('Content-Length', Buffer.byteLength(respBody).toString());
        return res.status(200).send(respBody);
      }
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Delete('media/titlegroups/:guid/storage/data')
  async deleteMediaListing(@Req() req: Request, @Res() res: Response) { return res.status(400).send(); }

  @Delete('media/titlegroups/:guid/storage/data/*path')
  async deleteMediaFile(@Req() req: Request, @Res() res: Response) {
    const guid = req.params.guid;
    const filename = this.extractPath(req.params);
    if (this.isListing(filename)) return res.status(400).send();
    try {
      const fp = this.sanitizePath('media', guid, filename);
      if (existsSync(fp)) await unlink(fp);
      this.logger.log(`DELETE media guid=${guid} file="${filename}"`);
      return res.status(200).send();
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }
}
