import { QueueService } from './queue.service';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    getStatus(): Promise<{
        scrape: import("./queue.service").QueueSummary;
        process: import("./queue.service").QueueSummary;
    }>;
}
