import {
  ConsoleLogger,
  Controller,
  Delete,
  Get,
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
export class NetworkStorageController {
  constructor(private readonly logger: ConsoleLogger) {
    this.logger.setContext(NetworkStorageController.name);
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

  private toISO8601(ms: number) {
    return new Date(ms).toISOString();
  }

  private storageDir(xuid: string, titleId: string) {
    const safeXuid = xuid.replace(/[^0-9]/g, '');
    const safeTitleId = titleId.replace(/[^0-9]/g, '');
    return join(this.storageRoot, safeXuid, safeTitleId);
  }

  @Get('storage/users/:xuidPart/savedgames/files')
  async getAllFiles(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    try {
      const safeXuid = xuid.replace(/[^0-9]/g, '');
      const userDir = join(this.storageRoot, safeXuid);
      const savedGames: any[] = [];

      if (existsSync(userDir)) {
        for (const titleDir of await readdir(userDir)) {
          const dir = join(userDir, titleDir);
          const s = await stat(dir);
          if (!s.isDirectory()) continue;
          for (const file of await readdir(dir)) {
            if (file.endsWith('.meta') || file.endsWith('.tmp')) continue;
            const fp = join(dir, file);
            const fs = await stat(fp);
            if (!fs.isFile()) continue;
            const xblName = this.toXblFilename(file);
            // Try to read display name from .meta file
            let displayName = xblName;
            const metaPath = fp + '.meta';
            if (existsSync(metaPath)) {
              try {
                const meta = await readFile(metaPath, 'utf8');
                const metaObj = JSON.parse(meta);
                if (metaObj.displayName) displayName = metaObj.displayName;
              } catch {}
            }
            savedGames.push({
              clientFileTime: this.toISO8601(fs.mtimeMs),
              fileName: xblName,
              displayName,
              size: fs.size,
              etag: `"${fs.size}-${fs.mtimeMs}"`,
              titleId: parseInt(titleDir, 10) || 0,
              noCopy: false,
              otherHasLock: false,
              callerHasLock: false,
            });
          }
        }
      }

      const max = parseInt(req.query.maxItems as string) || 500;
      const token = req.query.continuationToken as string;
      let items = savedGames;
      if (token) {
        const idx = savedGames.findIndex(g => g.fileName > token);
        items = idx >= 0 ? savedGames.slice(idx, idx + max) : [];
      } else {
        items = savedGames.slice(0, max);
      }
      const hasMore = savedGames.length > 0 && items.length >= max;

      const body = JSON.stringify({
        savedGames: items,
        pagingInfo: { continuationToken: hasMore ? items[items.length - 1]?.fileName : null },
      });
      res.set('Content-Type', 'application/json');
      res.set('Content-Length', Buffer.byteLength(body).toString());
      this.logger.log(`LIST ALL xuid=${xuid} count=${items.length}/${savedGames.length}`);
      return res.status(200).send(body);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Get('storage/users/:xuidPart/savedgames/titles')
  async getTitles(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    try {
      const safeXuid = xuid.replace(/[^0-9]/g, '');
      const userDir = join(this.storageRoot, safeXuid);
      const titles: any[] = [];

      if (existsSync(userDir)) {
        for (const titleDir of await readdir(userDir)) {
          const dir = join(userDir, titleDir);
          const s = await stat(dir);
          if (!s.isDirectory()) continue;
          let usedBytes = 0;
          for (const file of await readdir(dir)) {
            if (file.endsWith('.meta') || file.endsWith('.tmp')) continue;
            const fp = join(dir, file);
            const fs = await stat(fp);
            if (fs.isFile()) usedBytes += fs.size;
          }
          titles.push({ id: parseInt(titleDir, 10) || 0, usedBytes });
        }
      }

      const max = parseInt(req.query.maxItems as string) || 100;
      const items = titles.slice(0, max);
      const body = JSON.stringify({
        titles: items,
        pagingInfo: { continuationToken: null },
      });
      res.set('Content-Type', 'application/json');
      res.set('Content-Length', Buffer.byteLength(body).toString());
      this.logger.log(`LIST TITLES xuid=${xuid} count=${items.length}`);
      return res.status(200).send(body);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Get('storage/users/:xuidPart/savedgames/titles/:titleId')
  async getTitleInfo(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const titleId = req.params.titleId;
    try {
      const dir = this.storageDir(xuid, titleId);
      let usedBytes = 0;
      let lastModifyTime = 0;

      if (existsSync(dir)) {
        for (const file of await readdir(dir)) {
          if (file.endsWith('.meta') || file.endsWith('.tmp')) continue;
          const fp = join(dir, file);
          const s = await stat(fp);
          if (s.isFile()) {
            usedBytes += s.size;
            if (s.mtimeMs > lastModifyTime) lastModifyTime = s.mtimeMs;
          }
        }
      }

      const body = JSON.stringify({
        lastModifyTime: lastModifyTime > 0 ? this.toISO8601(lastModifyTime) : null,
        usedBytes,
        hasNoCopyFiles: false,
        callerHasLockedFiles: false,
        otherHasLockedFiles: false,
        checkedOutByCaller: false,
        checkedOutByOther: false,
      });
      res.set('Content-Type', 'application/json');
      res.set('Content-Length', Buffer.byteLength(body).toString());
      this.logger.log(`TITLE INFO xuid=${xuid} titleId=${titleId} usedBytes=${usedBytes}`);
      return res.status(200).send(body);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Get('storage/users/:xuidPart/savedgames/titles/:titleId/files')
  async getFiles(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const titleId = req.params.titleId;
    try {
      const dir = this.storageDir(xuid, titleId);
      const savedGames: any[] = [];

      if (existsSync(dir)) {
        for (const file of await readdir(dir)) {
          if (file.endsWith('.meta') || file.endsWith('.tmp')) continue;
          const fp = join(dir, file);
          const s = await stat(fp);
          if (!s.isFile()) continue;
          const xblName = this.toXblFilename(file);
          // Try to read display name from .meta file
          let displayName = xblName;
          const metaPath = fp + '.meta';
          if (existsSync(metaPath)) {
            try {
              const meta = await readFile(metaPath, 'utf8');
              const metaObj = JSON.parse(meta);
              if (metaObj.displayName) displayName = metaObj.displayName;
            } catch {}
          }
          savedGames.push({
            clientFileTime: this.toISO8601(s.mtimeMs),
            fileName: xblName,
            displayName,
            size: s.size,
            etag: `"${s.size}-${s.mtimeMs}"`,
            titleId: parseInt(titleId, 10) || 0,
            noCopy: false,
            otherHasLock: false,
            callerHasLock: false,
          });
        }
      }

      const max = parseInt(req.query.maxItems as string) || 100;
      const token = req.query.continuationToken as string;
      let items = savedGames;
      if (token) {
        const idx = savedGames.findIndex(g => g.fileName > token);
        items = idx >= 0 ? savedGames.slice(idx, idx + max) : [];
      } else {
        items = savedGames.slice(0, max);
      }
      const hasMore = savedGames.length > 0 && items.length >= max;

      const body = JSON.stringify({
        savedGames: items,
        pagingInfo: { continuationToken: hasMore ? items[items.length - 1]?.fileName : null },
      });
      res.set('Content-Type', 'application/json');
      res.set('Content-Length', Buffer.byteLength(body).toString());
      this.logger.log(`LIST FILES xuid=${xuid} titleId=${titleId} count=${items.length}/${savedGames.length}`);
      return res.status(200).send(body);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Get('storage/users/:xuidPart/savedgames/titles/:titleId/files/*path')
  async getFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const titleId = req.params.titleId;
    const filePart = this.extractPath(req.params);
    try {
      const dir = this.storageDir(xuid, titleId);
      const safeFile = this.normalizeFilename(filePart);
      const fp = join(dir, safeFile);

      if (!existsSync(fp)) {
        res.set('ETag', '"empty"');
        res.set('Content-Length', '0');
        return res.status(200).send();
      }

      const s = await stat(fp);
      const data = await readFile(fp);
      res.set('ETag', `"${s.size}-${s.mtimeMs}"`);
      res.set('Content-Length', s.size.toString());
      res.set('Content-Type', 'application/octet-stream');
      this.logger.log(`GET xuid=${xuid} titleId=${titleId} file="${filePart}" size=${s.size}`);
      return res.status(200).send(data);
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Put('storage/users/:xuidPart/savedgames/titles/:titleId/files/*path')
  async putFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const titleId = req.params.titleId;
    const filePart = this.extractPath(req.params);
    try {
      const dir = this.storageDir(xuid, titleId);
      const safeFile = this.normalizeFilename(filePart);
      const fp = join(dir, safeFile);

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

        // Extract display name from blob header and store as .meta
        // Blob format: [display_name_len:4][display_name:N][file_count:4]...
        try {
          const data = await readFile(fp);
          if (data.length >= 4) {
            const nameLen = data.readUInt32LE(0);
            if (nameLen > 0 && data.length >= 4 + nameLen) {
              const displayName = data.toString('utf8', 4, 4 + nameLen);
              await writeFile(fp + '.meta', JSON.stringify({ displayName }));
            }
          }
        } catch {}

        const s = await stat(fp);
        const etag = `"${s.size}-${s.mtimeMs}"`;
        this.logger.log(`PUT xuid=${xuid} titleId=${titleId} file="${filePart}" size=${s.size} -> 201`);
        res.set('ETag', etag);
        return res.status(201).send();
      } else {
        const tmpPath = fp + '.tmp';
        if (continuationToken && existsSync(tmpPath)) {
          await appendFile(tmpPath, body);
        } else {
          await writeFile(tmpPath, body);
        }
        this.logger.log(`PUT xuid=${xuid} titleId=${titleId} file="${filePart}" block=${body.length} -> 200`);
        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        res.set('ETag', `"partial-${token}"`);
        return res.status(200).send(token);
      }
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Delete('storage/users/:xuidPart/savedgames/titles/:titleId/files/*path')
  async deleteFile(@Req() req: Request, @Res() res: Response) {
    const xuid = this.extractXuid(req.params.xuidPart);
    const titleId = req.params.titleId;
    const filePart = this.extractPath(req.params);
    try {
      const dir = this.storageDir(xuid, titleId);
      const safeFile = this.normalizeFilename(filePart);
      const fp = join(dir, safeFile);
      if (existsSync(fp)) await unlink(fp);
      if (existsSync(fp + '.meta')) await unlink(fp + '.meta');
      this.logger.log(`DELETE xuid=${xuid} titleId=${titleId} file="${filePart}"`);
      return res.status(200).send();
    } catch (err) {
      this.logger.error(`${err}`);
      return res.status(500).send();
    }
  }

  @Put('storage/users/:xuidPart/savedgames/titles/:titleId/lock')
  async putTitleLock(@Req() req: Request, @Res() res: Response) {
    return res.status(200).send();
  }

  @Delete('storage/users/:xuidPart/savedgames/titles/:titleId/lock')
  async deleteTitleLock(@Req() req: Request, @Res() res: Response) {
    return res.status(200).send();
  }

  @Get('storage/users/:xuidPart/savedgames/titles/:titleId/metadata')
  async getMetadata(@Req() req: Request, @Res() res: Response) {
    return res.status(200).send();
  }

  @Put('storage/users/:xuidPart/savedgames/titles/:titleId/metadata')
  async putMetadata(@Req() req: Request, @Res() res: Response) {
    return res.status(200).send();
  }
}
