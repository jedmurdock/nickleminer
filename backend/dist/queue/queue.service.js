"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
let QueueService = QueueService_1 = class QueueService {
    configService;
    logger = new common_1.Logger(QueueService_1.name);
    connection;
    scrapeQueue;
    processQueue;
    constructor(configService) {
        this.configService = configService;
        const host = this.configService.get('REDIS_HOST') ?? '127.0.0.1';
        const port = parseInt(this.configService.get('REDIS_PORT') ?? '6379', 10);
        const username = this.configService.get('REDIS_USERNAME');
        const password = this.configService.get('REDIS_PASSWORD');
        this.connection = {
            host,
            port,
            username: username || undefined,
            password: password || undefined,
        };
        const queueOptions = {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: 50,
            },
        };
        this.scrapeQueue = new bullmq_1.Queue(queue_constants_1.SCRAPE_QUEUE_NAME, queueOptions);
        this.processQueue = new bullmq_1.Queue(queue_constants_1.PROCESS_QUEUE_NAME, queueOptions);
    }
    getConnection() {
        return this.connection;
    }
    getScrapeQueue() {
        return this.scrapeQueue;
    }
    getProcessQueue() {
        return this.processQueue;
    }
    async getSummary() {
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
    async enqueueScrapeYear(year, options) {
        this.logger.log(`Enqueuing scrape job for year ${year}`);
        return this.scrapeQueue.add('scrape-year', { year }, options);
    }
    async enqueueProcessShow(showId, options) {
        this.logger.log(`Enqueuing process job for show ${showId}`);
        return this.processQueue.add('process-show', { showId }, options);
    }
    async onModuleDestroy() {
        await Promise.allSettled([
            this.scrapeQueue.close(),
            this.processQueue.close(),
        ]);
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QueueService);
//# sourceMappingURL=queue.service.js.map