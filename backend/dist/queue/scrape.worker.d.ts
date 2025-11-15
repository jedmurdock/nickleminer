import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ScraperService } from '../scraper/scraper.service';
import { ConfigService } from '@nestjs/config';
export declare class ScrapeWorker implements OnModuleInit, OnModuleDestroy {
    private readonly queueService;
    private readonly scraperService;
    private readonly configService;
    private readonly logger;
    private worker?;
    constructor(queueService: QueueService, scraperService: ScraperService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
}
