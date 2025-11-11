import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { AudioService } from '../audio/audio.service';

@Controller('shows')
export class ShowsController {
  constructor(private readonly audioService: AudioService) {}

  @Get(':id/stream')
  async streamShow(
    @Param('id') showId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { absolutePath, format, size } = await this.audioService.getStreamPath(showId);
    const contentType = this.getContentType(format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    const range = req.headers.range;
    if (range) {
      const { start, end } = this.parseRange(range, size);
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(chunkSize));
      const stream = createReadStream(absolutePath, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', String(size));
      const stream = createReadStream(absolutePath);
      stream.pipe(res);
    }
  }

  private getContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'ogg':
        return 'audio/ogg';
      case 'aac':
        return 'audio/aac';
      case 'm4a':
        return 'audio/mp4';
      case 'mp4':
        return 'audio/mp4';
      case 'wav':
        return 'audio/wav';
      case 'flac':
        return 'audio/flac';
      case 'mp3':
      default:
        return 'audio/mpeg';
    }
  }

  private parseRange(rangeHeader: string, size: number): { start: number; end: number } {
    const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!matches) {
      return { start: 0, end: size - 1 };
    }

    const start = matches[1] ? parseInt(matches[1], 10) : 0;
    const end = matches[2] ? parseInt(matches[2], 10) : size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
      return { start: 0, end: size - 1 };
    }

    return { start, end };
  }
}
