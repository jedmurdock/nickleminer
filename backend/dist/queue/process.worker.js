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
var ProcessWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessWorker = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
const queue_service_1 = require("./queue.service");
const audio_service_1 = require("../audio/audio.service");
const config_1 = require("@nestjs/config");
let ProcessWorker = ProcessWorker_1 = class ProcessWorker {
    queueService;
    audioService;
    configService;
    logger = new common_1.Logger(ProcessWorker_1.name);
    worker;
    constructor(queueService, audioService, configService) {
        this.queueService = queueService;
        this.audioService = audioService;
        this.configService = configService;
    }
    onModuleInit() {
        const concurrency = parseInt(this.configService.get('PROCESS_CONCURRENCY') ?? '2', 10);
        this.worker = new bullmq_1.Worker(queue_constants_1.PROCESS_QUEUE_NAME, async (job) => {
            const { showId } = job.data;
            this.logger.log(`Process job ${job.id} started for show ${showId}`);
            await this.audioService.processShow(showId);
            this.logger.log(`Process job ${job.id} completed for show ${showId}`);
        }, {
            connection: this.queueService.getConnection(),
            concurrency,
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Process job ${job?.id} failed: ${err.message}`, err.stack);
        });
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close();
        }
    }
};
exports.ProcessWorker = ProcessWorker;
exports.ProcessWorker = ProcessWorker = ProcessWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        audio_service_1.AudioService,
        config_1.ConfigService])
], ProcessWorker);
//# sourceMappingURL=process.worker.js.map