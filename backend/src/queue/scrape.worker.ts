import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, forwardRef } from '@nestjs/common';
import { Worker } from 'bullmq';
import { SCRAPE_QUEUE_NAME } from './queue.constants';
import { QueueService } from './queue.service';
import { ScraperService } from '../scraper/scraper.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScrapeWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScrapeWorker.name);
  private worker?: Worker;

  constructor(
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => ScraperService))
    private readonly scraperService: ScraperService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const concurrency = parseInt(this.configService.get<string>('SCRAPE_CONCURRENCY') ?? '1', 10);

    this.worker = new Worker(
      SCRAPE_QUEUE_NAME,
      async (job) => {
        const { year } = job.data as { year: number };
        this.logger.log(`Scrape job ${job.id} started for year ${year}`);
        await this.scraperService.scrapeYear(year);
        this.logger.log(`Scrape job ${job.id} completed for year ${year}`);
      },
      {
        connection: this.queueService.getConnection(),
        concurrency,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Scrape job ${job?.id} failed: ${err.message}`, err.stack);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
