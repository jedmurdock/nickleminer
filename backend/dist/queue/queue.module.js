"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const queue_service_1 = require("./queue.service");
const scrape_worker_1 = require("./scrape.worker");
const process_worker_1 = require("./process.worker");
const scraper_module_1 = require("../scraper/scraper.module");
const audio_module_1 = require("../audio/audio.module");
const queue_controller_1 = require("./queue.controller");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, (0, common_1.forwardRef)(() => scraper_module_1.ScraperModule), audio_module_1.AudioModule],
        providers: [queue_service_1.QueueService, scrape_worker_1.ScrapeWorker, process_worker_1.ProcessWorker],
        controllers: [queue_controller_1.QueueController],
        exports: [queue_service_1.QueueService],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map