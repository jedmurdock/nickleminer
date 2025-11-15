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
const scrape_year_dto_1 = require("./dto/scrape-year.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let ScraperController = class ScraperController {
    scraperService;
    audioService;
    constructor(scraperService, audioService) {
        this.scraperService = scraperService;
        this.audioService = audioService;
    }
    async scrapeYear(dto) {
        await this.scraperService.scrapeYear(dto.year);
        return {
            message: `Started scraping year ${dto.year}`,
            year: dto.year,
        };
    }
    async getAllShows(pagination) {
        const page = pagination.page || 1;
        const limit = pagination.limit || 20;
        const skip = (page - 1) * limit;
        const [shows, total] = await Promise.all([
            this.scraperService.getAllShows(skip, limit),
            this.scraperService.getShowsCount(),
        ]);
        return {
            data: shows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
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
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scrape_year_dto_1.ScrapeYearDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "scrapeYear", null);
__decorate([
    (0, common_1.Get)('shows'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
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