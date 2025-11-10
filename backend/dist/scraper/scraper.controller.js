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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperController = void 0;
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("./scraper.service");
const audio_service_1 = require("../audio/audio.service");
let ScraperController = class ScraperController {
    scraperService;
    audioService;
    constructor(scraperService, audioService) {
        this.scraperService = scraperService;
        this.audioService = audioService;
    }
    async scrapeYear(year) {
        const targetYear = year || 2020;
        await this.scraperService.scrapeYear(targetYear);
        return {
            message: `Started scraping year ${targetYear}`,
            year: targetYear,
        };
    }
    async getAllShows() {
        const shows = await this.scraperService.getAllShows();
        return {
            count: shows.length,
            shows,
        };
    }
    async getShow(id) {
        return this.scraperService.getShow(id);
    }
    async processShow(id) {
        const result = await this.audioService.processShow(id);
        return {
            message: 'Audio processing complete',
            ...result,
        };
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Post)('scrape-year'),
    __param(0, (0, common_1.Body)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "scrapeYear", null);
__decorate([
    (0, common_1.Get)('shows'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getAllShows", null);
__decorate([
    (0, common_1.Get)('shows/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getShow", null);
__decorate([
    (0, common_1.Post)('shows/:id/process'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "processShow", null);
exports.ScraperController = ScraperController = __decorate([
    (0, common_1.Controller)('scraper'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService,
        audio_service_1.AudioService])
], ScraperController);
//# sourceMappingURL=scraper.controller.js.map