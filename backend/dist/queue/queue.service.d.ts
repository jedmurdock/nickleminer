import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, JobsOptions } from 'bullmq';
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
export declare class QueueService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly connection;
    private readonly scrapeQueue;
    private readonly processQueue;
    constructor(configService: ConfigService);
    getConnection(): RedisConnection;
    getScrapeQueue(): Queue;
    getProcessQueue(): Queue;
    getSummary(): Promise<{
        scrape: QueueSummary;
        process: QueueSummary;
    }>;
    enqueueScrapeYear(year: number, options?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    enqueueProcessShow(showId: string, options?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    onModuleDestroy(): Promise<void>;
}
export {};
