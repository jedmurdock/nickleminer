import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueService } from './queue.service';
import { ScrapeWorker } from './scrape.worker';
import { ProcessWorker } from './process.worker';
import { ScraperModule } from '../scraper/scraper.module';
import { AudioModule } from '../audio/audio.module';
import { QueueController } from './queue.controller';

@Module({
  imports: [ConfigModule, forwardRef(() => ScraperModule), AudioModule],
  providers: [QueueService, ScrapeWorker, ProcessWorker],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
