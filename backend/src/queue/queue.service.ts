import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, JobsOptions, QueueOptions } from 'bullmq';
import { PROCESS_QUEUE_NAME, SCRAPE_QUEUE_NAME } from './queue.constants';

interface RedisConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export type QueueSummary = {
  name: string;
  counts: Record<string, number>;
  isPaused: boolean;
};

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection: RedisConnection;
  private readonly scrapeQueue: Queue;
  private readonly processQueue: Queue;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = parseInt(this.configService.get<string>('REDIS_PORT') ?? '6379', 10);
    const username = this.configService.get<string>('REDIS_USERNAME');
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.connection = {
      host,
      port,
      username: username || undefined,
      password: password || undefined,
    };

    const queueOptions: QueueOptions = {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    };

    this.scrapeQueue = new Queue(SCRAPE_QUEUE_NAME, queueOptions);
    this.processQueue = new Queue(PROCESS_QUEUE_NAME, queueOptions);
  }

  getConnection(): RedisConnection {
    return this.connection;
  }

  getScrapeQueue(): Queue {
    return this.scrapeQueue;
  }

  getProcessQueue(): Queue {
    return this.processQueue;
  }

  async getSummary(): Promise<{ scrape: QueueSummary; process: QueueSummary }> {
    const [scrapeCounts, processCounts, scrapePaused, processPaused] = await Promise.all([
      this.scrapeQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused'),
      this.processQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused'),
      this.scrapeQueue.isPaused(),
      this.processQueue.isPaused(),
    ]);

    return {
      scrape: {
        name: this.scrapeQueue.name,
        counts: scrapeCounts,
        isPaused: scrapePaused,
      },
      process: {
        name: this.processQueue.name,
        counts: processCounts,
        isPaused: processPaused,
      },
    };
  }

  async enqueueScrapeYear(year: number, options?: JobsOptions) {
    this.logger.log(`Enqueuing scrape job for year ${year}`);
    return this.scrapeQueue.add('scrape-year', { year }, options);
  }

  async enqueueProcessShow(showId: string, options?: JobsOptions) {
    this.logger.log(`Enqueuing process job for show ${showId}`);
    return this.processQueue.add('process-show', { showId }, options);
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.scrapeQueue.close(),
      this.processQueue.close(),
    ]);
  }
}
