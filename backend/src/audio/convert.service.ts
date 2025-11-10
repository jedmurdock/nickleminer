import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { spawn } from 'child_process';

export interface ConvertResult {
  absolutePath: string;
  relativePath: string;
  format: string;
  skipped: boolean;
}

@Injectable()
export class AudioConvertService {
  private readonly logger = new Logger(AudioConvertService.name);
  private readonly storageRoot: string;
  private readonly convertedDir: string;
  private readonly ffmpegBinary: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath = this.configService.get<string>('STORAGE_PATH') ?? '../storage';
    this.storageRoot = path.resolve(process.cwd(), configuredPath);
    this.convertedDir = path.join(this.storageRoot, 'converted');
    this.ffmpegBinary = this.configService.get<string>('FFMPEG_PATH') ?? 'ffmpeg';
  }

  async convert(showId: string, inputPath: string): Promise<ConvertResult> {
    await this.ensureDirectories();

    const outputPath = path.join(this.convertedDir, `${showId}.ogg`);
    const relativePath = path.relative(this.storageRoot, outputPath);

    if (await this.fileExists(outputPath)) {
      this.logger.log(`Converted audio already exists for show ${showId}`);
      return {
        absolutePath: outputPath,
        relativePath,
        format: 'ogg',
        skipped: true,
      };
    }

    this.logger.log(`Converting ${inputPath} to ${outputPath}`);
    await this.runFfmpeg(inputPath, outputPath);

    return {
      absolutePath: outputPath,
      relativePath,
      format: 'ogg',
      skipped: false,
    };
  }

  private async ensureDirectories(): Promise<void> {
    await mkdir(this.convertedDir, { recursive: true });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegBinary, [
        '-y',
        '-i',
        inputPath,
        '-c:a',
        'libvorbis',
        '-q:a',
        '6',
        outputPath,
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }
}
