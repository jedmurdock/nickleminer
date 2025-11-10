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
var AudioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const download_service_1 = require("./download.service");
const convert_service_1 = require("./convert.service");
let AudioService = AudioService_1 = class AudioService {
    prisma;
    downloadService;
    convertService;
    logger = new common_1.Logger(AudioService_1.name);
    constructor(prisma, downloadService, convertService) {
        this.prisma = prisma;
        this.downloadService = downloadService;
        this.convertService = convertService;
    }
    async processShow(showId) {
        const show = await this.prisma.show.findUnique({ where: { id: showId } });
        if (!show) {
            throw new common_1.NotFoundException(`Show ${showId} not found`);
        }
        if (!show.archiveUrl) {
            throw new common_1.BadRequestException('Show does not have an archive URL');
        }
        this.logger.log(`Processing audio for show ${showId}`);
        const downloadResult = await this.downloadService.download(show);
        if (!downloadResult.skipped) {
            await this.prisma.show.update({
                where: { id: showId },
                data: {
                    rawAudioPath: downloadResult.relativePath,
                    rawAudioFormat: downloadResult.format,
                    downloadedAt: new Date(),
                    processingState: 'downloaded',
                },
            });
        }
        const convertResult = await this.convertService.convert(showId, downloadResult.absolutePath);
        const updatedShow = await this.prisma.show.update({
            where: { id: showId },
            data: {
                audioPath: convertResult.relativePath,
                audioFormat: convertResult.format,
                convertedAt: convertResult.skipped ? show.convertedAt ?? new Date() : new Date(),
                processed: true,
                processingState: 'converted',
            },
        });
        return {
            show: updatedShow,
            download: {
                relativePath: downloadResult.relativePath,
                format: downloadResult.format,
                skipped: downloadResult.skipped,
            },
            conversion: {
                relativePath: convertResult.relativePath,
                format: convertResult.format,
                skipped: convertResult.skipped,
            },
        };
    }
};
exports.AudioService = AudioService;
exports.AudioService = AudioService = AudioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        download_service_1.AudioDownloadService,
        convert_service_1.AudioConvertService])
], AudioService);
//# sourceMappingURL=audio.service.js.map