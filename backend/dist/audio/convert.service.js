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
var AudioConvertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioConvertService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path = __importStar(require("path"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
let AudioConvertService = AudioConvertService_1 = class AudioConvertService {
    configService;
    logger = new common_1.Logger(AudioConvertService_1.name);
    storageRoot;
    convertedDir;
    ffmpegBinary;
    constructor(configService) {
        this.configService = configService;
        const configuredPath = this.configService.get('STORAGE_PATH') ?? '../storage';
        this.storageRoot = path.resolve(process.cwd(), configuredPath);
        this.convertedDir = path.join(this.storageRoot, 'converted');
        this.ffmpegBinary = this.configService.get('FFMPEG_PATH') ?? 'ffmpeg';
    }
    getStorageRoot() {
        return this.storageRoot;
    }
    getDefaultFormat() {
        return 'ogg';
    }
    async convert(showId, inputPath) {
        await this.ensureDirectories();
        const outputPath = path.join(this.convertedDir, `${showId}.ogg`);
        const relativePath = path.relative(this.storageRoot, outputPath);
        if (await this.fileExists(outputPath)) {
            this.logger.log(`Converted audio already exists for show ${showId}`);
            return {
                absolutePath: outputPath,
                relativePath,
                format: 'ogg',
                skipped: true,
            };
        }
        this.logger.log(`Converting ${inputPath} to ${outputPath}`);
        await this.runFfmpeg(inputPath, outputPath);
        return {
            absolutePath: outputPath,
            relativePath,
            format: 'ogg',
            skipped: false,
        };
    }
    async ensureDirectories() {
        await (0, promises_1.mkdir)(this.convertedDir, { recursive: true });
    }
    async fileExists(filePath) {
        try {
            await (0, promises_1.access)(filePath, fs_1.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    runFfmpeg(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            const ffmpeg = (0, child_process_1.spawn)(this.ffmpegBinary, [
                '-y',
                '-i',
                inputPath,
                '-c:a',
                'libvorbis',
                '-q:a',
                '6',
                outputPath,
            ]);
            let stderr = '';
            ffmpeg.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
                }
            });
            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }
};
exports.AudioConvertService = AudioConvertService;
exports.AudioConvertService = AudioConvertService = AudioConvertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AudioConvertService);
//# sourceMappingURL=convert.service.js.map