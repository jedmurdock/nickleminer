import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AudioDownloadService, DownloadResult } from './download.service';
import { AudioConvertService, ConvertResult } from './convert.service';
import { Show } from '@prisma/client';

interface ProcessResult {
  show: Show;
  download: Omit<DownloadResult, 'absolutePath'>;
  conversion: Omit<ConvertResult, 'absolutePath'>;
}

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly downloadService: AudioDownloadService,
    private readonly convertService: AudioConvertService,
  ) {}

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
}
