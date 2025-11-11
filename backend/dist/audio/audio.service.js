"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AudioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../database/prisma.service");
const download_service_1 = require("./download.service");
const convert_service_1 = require("./convert.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
let AudioService = AudioService_1 = class AudioService {
    prisma;
    downloadService;
    convertService;
    configService;
    logger = new common_1.Logger(AudioService_1.name);
    storageRoot;
    constructor(prisma, downloadService, convertService, configService) {
        this.prisma = prisma;
        this.downloadService = downloadService;
        this.convertService = convertService;
        this.configService = configService;
        const configuredPath = this.configService.get('STORAGE_PATH') ?? '../storage';
        this.storageRoot = path.resolve(process.cwd(), configuredPath);
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
    async getStreamPath(showId) {
        const show = await this.prisma.show.findUnique({ where: { id: showId } });
        if (!show) {
            throw new common_1.NotFoundException(`Show ${showId} not found`);
        }
        const storageRoot = this.storageRoot;
        const attemptPaths = [
            { path: show.audioPath ?? null, format: show.audioFormat ?? null, label: 'converted' },
            { path: show.rawAudioPath ?? null, format: show.rawAudioFormat ?? show.audioFormat ?? null, label: 'raw' },
            { path: show.archiveUrl ?? null, format: show.rawAudioFormat ?? show.audioFormat ?? null, label: 'remote' },
        ];
        for (const candidate of attemptPaths) {
            if (!candidate.path)
                continue;
            if (candidate.label === 'remote' && candidate.path.startsWith('http')) {
                throw new common_1.BadRequestException('Audio has not been downloaded yet. Please process the show first.');
            }
            const absolutePath = path.isAbsolute(candidate.path)
                ? candidate.path
                : path.join(storageRoot, candidate.path);
            try {
                const stats = await fs.stat(absolutePath);
                if (stats.isFile()) {
                    return {
                        absolutePath,
                        format: candidate.format ?? this.convertService.getDefaultFormat(),
                        size: stats.size,
                    };
                }
            }
            catch (error) {
                this.logger.debug(`Stream candidate missing for show ${showId}: ${absolutePath}`);
            }
        }
        throw new common_1.BadRequestException('No local audio found. Process the show first.');
    }
    getStorageRoot() {
        return this.storageRoot;
    }
};
exports.AudioService = AudioService;
exports.AudioService = AudioService = AudioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        download_service_1.AudioDownloadService,
        convert_service_1.AudioConvertService,
        config_1.ConfigService])
], AudioService);
//# sourceMappingURL=audio.service.js.map