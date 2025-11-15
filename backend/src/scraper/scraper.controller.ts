import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { AudioService } from '../audio/audio.service';
import { ScrapeYearDto } from './dto/scrape-year.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly audioService: AudioService,
  ) {}

  @Post('scrape-year')
  async scrapeYear(@Body() dto: ScrapeYearDto) {
    await this.scraperService.scrapeYear(dto.year);
    return {
      message: `Started scraping year ${dto.year}`,
      year: dto.year,
    };
  }

  @Get('shows')
  async getAllShows(@Query() pagination: PaginationDto): Promise<PaginatedResponse<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [shows, total] = await Promise.all([
      this.scraperService.getAllShows(skip, limit),
      this.scraperService.getShowsCount(),
    ]);

    return {
      data: shows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('shows/:id')
  async getShow(@Param('id') id: string) {
    return this.scraperService.getShow(id);
  }

  @Post('shows/:id/process')
  async processShow(@Param('id') id: string) {
    const result = await this.audioService.processShow(id);
    return {
      message: 'Audio processing complete',
      ...result,
    };
  }
}

