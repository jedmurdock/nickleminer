import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PROCESS_QUEUE_NAME } from './queue.constants';
import { QueueService } from './queue.service';
import { AudioService } from '../audio/audio.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProcessWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessWorker.name);
  private worker?: Worker;

  constructor(
    private readonly queueService: QueueService,
    private readonly audioService: AudioService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const concurrency = parseInt(this.configService.get<string>('PROCESS_CONCURRENCY') ?? '2', 10);

    this.worker = new Worker(
      PROCESS_QUEUE_NAME,
      async (job) => {
        const { showId } = job.data as { showId: string };
        this.logger.log(`Process job ${job.id} started for show ${showId}`);
        await this.audioService.processShow(showId);
        this.logger.log(`Process job ${job.id} completed for show ${showId}`);
      },
      {
        connection: this.queueService.getConnection(),
        concurrency,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Process job ${job?.id} failed: ${err.message}`, err.stack);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
