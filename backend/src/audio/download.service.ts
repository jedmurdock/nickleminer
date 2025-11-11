import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Show } from '@prisma/client';
import axios from 'axios';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { pipeline } from 'stream/promises';

export interface DownloadResult {
  absolutePath: string;
  relativePath: string;
  format: string;
  skipped: boolean;
}

@Injectable()
export class AudioDownloadService {
  private readonly logger = new Logger(AudioDownloadService.name);
  private readonly storageRoot: string;
  private readonly rawDir: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath = this.configService.get<string>('STORAGE_PATH') ?? '../storage';
    this.storageRoot = path.resolve(process.cwd(), configuredPath);
    this.rawDir = path.join(this.storageRoot, 'raw');
  }

  getStorageRoot(): string {
    return this.storageRoot;
  }

  async download(show: Show): Promise<DownloadResult> {
    if (!show.archiveUrl) {
      throw new Error('Cannot download audio without an archive URL');
    }

    await this.ensureDirectories();

    const { extension, format } = this.inferExtension(show.archiveUrl);
    const fileName = `${show.id}${extension}`;
    const absolutePath = path.join(this.rawDir, fileName);
    const relativePath = path.relative(this.storageRoot, absolutePath);

    if (await this.fileExists(absolutePath)) {
      this.logger.log(`Raw audio already exists for show ${show.id}`);
      return {
        absolutePath,
        relativePath,
        format,
        skipped: true,
      };
    }

    this.logger.log(`Downloading archive for show ${show.id} from ${show.archiveUrl}`);

    const response = await axios.get(show.archiveUrl, { responseType: 'stream' });
    const writer = createWriteStream(absolutePath);
    await pipeline(response.data, writer);

    return {
      absolutePath,
      relativePath,
      format,
      skipped: false,
    };
  }

  private async ensureDirectories(): Promise<void> {
    await mkdir(this.rawDir, { recursive: true });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private inferExtension(archiveUrl: string): { extension: string; format: string } {
    try {
      const parsed = new URL(archiveUrl);
      const ext = path.extname(parsed.pathname).toLowerCase();
      if (ext) {
        return { extension: ext, format: ext.replace('.', '') };
      }
    } catch {
      // ignore URL parsing issues
    }

    // Default to mp3 if we cannot detect
    return { extension: '.mp3', format: 'mp3' };
  }
}
