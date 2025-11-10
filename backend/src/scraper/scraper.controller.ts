import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { AudioService } from '../audio/audio.service';

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly audioService: AudioService,
  ) {}

  @Post('scrape-year')
  async scrapeYear(@Body('year') year: number) {
    // Default to 2020 if not provided
    const targetYear = year || 2020;
    await this.scraperService.scrapeYear(targetYear);
    return {
      message: `Started scraping year ${targetYear}`,
      year: targetYear,
    };
  }

  @Get('shows')
  async getAllShows() {
    const shows = await this.scraperService.getAllShows();
    return {
      count: shows.length,
      shows,
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

