import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AudioDownloadService, DownloadResult } from './download.service';
import { AudioConvertService, ConvertResult } from './convert.service';
import { Show } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ProcessResult {
  show: Show;
  download: Omit<DownloadResult, 'absolutePath'>;
  conversion: Omit<ConvertResult, 'absolutePath'>;
}

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly storageRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly downloadService: AudioDownloadService,
    private readonly convertService: AudioConvertService,
    private readonly configService: ConfigService,
  ) {
    const configuredPath = this.configService.get<string>('STORAGE_PATH') ?? '../storage';
    this.storageRoot = path.resolve(process.cwd(), configuredPath);
  }

  async processShow(showId: string): Promise<ProcessResult> {
    const show = await this.prisma.show.findUnique({ where: { id: showId } });

    if (!show) {
      throw new NotFoundException(`Show ${showId} not found`);
    }

    if (!show.archiveUrl) {
      throw new BadRequestException('Show does not have an archive URL');
    }

    this.logger.log(`Processing audio for show ${showId}`);

    const downloadResult = await this.downloadService.download(show);

    if (!downloadResult.skipped) {
      await this.prisma.show.update({
        where: { id: showId },
        data: {
          rawAudioPath: downloadResult.relativePath,
          rawAudioFormat: downloadResult.format,
          downloadedAt: new Date(),
          processingState: 'downloaded',
        },
      });
    }

    const convertResult = await this.convertService.convert(showId, downloadResult.absolutePath);

    const updatedShow = await this.prisma.show.update({
      where: { id: showId },
      data: {
        audioPath: convertResult.relativePath,
        audioFormat: convertResult.format,
        convertedAt: convertResult.skipped ? show.convertedAt ?? new Date() : new Date(),
        processed: true,
        processingState: 'converted',
      },
    });

    return {
      show: updatedShow,
      download: {
        relativePath: downloadResult.relativePath,
        format: downloadResult.format,
        skipped: downloadResult.skipped,
      },
      conversion: {
        relativePath: convertResult.relativePath,
        format: convertResult.format,
        skipped: convertResult.skipped,
      },
    };
  }

  async getStreamPath(showId: string): Promise<{
    absolutePath: string;
    format: string;
    size: number;
  }> {
    const show = await this.prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException(`Show ${showId} not found`);
    }

    const storageRoot = this.storageRoot;

    const attemptPaths: Array<{ path: string | null; format: string | null; label: 'converted' | 'raw' | 'remote' }> = [
      { path: show.audioPath ?? null, format: show.audioFormat ?? null, label: 'converted' },
      { path: show.rawAudioPath ?? null, format: show.rawAudioFormat ?? show.audioFormat ?? null, label: 'raw' },
      { path: show.archiveUrl ?? null, format: show.rawAudioFormat ?? show.audioFormat ?? null, label: 'remote' },
    ];

    for (const candidate of attemptPaths) {
      if (!candidate.path) continue;

      if (candidate.label === 'remote' && candidate.path.startsWith('http')) {
        throw new BadRequestException('Audio has not been downloaded yet. Please process the show first.');
      }

      const absolutePath = path.isAbsolute(candidate.path)
        ? candidate.path
        : path.join(storageRoot, candidate.path);

      try {
        const stats = await fs.stat(absolutePath);
        if (stats.isFile()) {
          return {
            absolutePath,
            format: candidate.format ?? this.convertService.getDefaultFormat(),
            size: stats.size,
          };
        }
      } catch (error) {
        this.logger.debug(`Stream candidate missing for show ${showId}: ${absolutePath}`);
      }
    }

    throw new BadRequestException('No local audio found. Process the show first.');
  }

  private getStorageRoot(): string {
    return this.storageRoot;
  }
}
