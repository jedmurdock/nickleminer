import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

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
}

