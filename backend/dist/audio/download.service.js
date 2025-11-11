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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AudioDownloadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioDownloadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const fs_2 = require("fs");
const promises_2 = require("stream/promises");
let AudioDownloadService = AudioDownloadService_1 = class AudioDownloadService {
    configService;
    logger = new common_1.Logger(AudioDownloadService_1.name);
    storageRoot;
    rawDir;
    constructor(configService) {
        this.configService = configService;
        const configuredPath = this.configService.get('STORAGE_PATH') ?? '../storage';
        this.storageRoot = path.resolve(process.cwd(), configuredPath);
        this.rawDir = path.join(this.storageRoot, 'raw');
    }
    getStorageRoot() {
        return this.storageRoot;
    }
    async download(show) {
        if (!show.archiveUrl) {
            throw new Error('Cannot download audio without an archive URL');
        }
        await this.ensureDirectories();
        const { extension, format } = this.inferExtension(show.archiveUrl);
        const fileName = `${show.id}${extension}`;
        const absolutePath = path.join(this.rawDir, fileName);
        const relativePath = path.relative(this.storageRoot, absolutePath);
        if (await this.fileExists(absolutePath)) {
            this.logger.log(`Raw audio already exists for show ${show.id}`);
            return {
                absolutePath,
                relativePath,
                format,
                skipped: true,
            };
        }
        this.logger.log(`Downloading archive for show ${show.id} from ${show.archiveUrl}`);
        const response = await axios_1.default.get(show.archiveUrl, { responseType: 'stream' });
        const writer = (0, fs_1.createWriteStream)(absolutePath);
        await (0, promises_2.pipeline)(response.data, writer);
        return {
            absolutePath,
            relativePath,
            format,
            skipped: false,
        };
    }
    async ensureDirectories() {
        await (0, promises_1.mkdir)(this.rawDir, { recursive: true });
    }
    async fileExists(filePath) {
        try {
            await (0, promises_1.access)(filePath, fs_2.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    inferExtension(archiveUrl) {
        try {
            const parsed = new URL(archiveUrl);
            const ext = path.extname(parsed.pathname).toLowerCase();
            if (ext) {
                return { extension: ext, format: ext.replace('.', '') };
            }
        }
        catch {
        }
        return { extension: '.mp3', format: 'mp3' };
    }
};
exports.AudioDownloadService = AudioDownloadService;
exports.AudioDownloadService = AudioDownloadService = AudioDownloadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AudioDownloadService);
//# sourceMappingURL=download.service.js.map