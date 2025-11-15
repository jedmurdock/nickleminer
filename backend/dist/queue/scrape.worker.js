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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScrapeWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeWorker = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
const queue_service_1 = require("./queue.service");
const scraper_service_1 = require("../scraper/scraper.service");
const config_1 = require("@nestjs/config");
let ScrapeWorker = ScrapeWorker_1 = class ScrapeWorker {
    queueService;
    scraperService;
    configService;
    logger = new common_1.Logger(ScrapeWorker_1.name);
    worker;
    constructor(queueService, scraperService, configService) {
        this.queueService = queueService;
        this.scraperService = scraperService;
        this.configService = configService;
    }
    onModuleInit() {
        const concurrency = parseInt(this.configService.get('SCRAPE_CONCURRENCY') ?? '1', 10);
        this.worker = new bullmq_1.Worker(queue_constants_1.SCRAPE_QUEUE_NAME, async (job) => {
            const { year } = job.data;
            this.logger.log(`Scrape job ${job.id} started for year ${year}`);
            await this.scraperService.scrapeYear(year);
            this.logger.log(`Scrape job ${job.id} completed for year ${year}`);
        }, {
            connection: this.queueService.getConnection(),
            concurrency,
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Scrape job ${job?.id} failed: ${err.message}`, err.stack);
        });
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close();
        }
    }
};
exports.ScrapeWorker = ScrapeWorker;
exports.ScrapeWorker = ScrapeWorker = ScrapeWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => scraper_service_1.ScraperService))),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        scraper_service_1.ScraperService,
        config_1.ConfigService])
], ScrapeWorker);
//# sourceMappingURL=scrape.worker.js.map