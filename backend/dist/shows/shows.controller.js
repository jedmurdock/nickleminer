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
exports.ShowsController = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const audio_service_1 = require("../audio/audio.service");
let ShowsController = class ShowsController {
    audioService;
    constructor(audioService) {
        this.audioService = audioService;
    }
    async streamShow(showId, req, res) {
        const { absolutePath, format, size } = await this.audioService.getStreamPath(showId);
        const contentType = this.getContentType(format);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        const range = req.headers.range;
        if (range) {
            const { start, end } = this.parseRange(range, size);
            const chunkSize = end - start + 1;
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
            res.setHeader('Content-Length', String(chunkSize));
            const stream = (0, fs_1.createReadStream)(absolutePath, { start, end });
            stream.pipe(res);
        }
        else {
            res.setHeader('Content-Length', String(size));
            const stream = (0, fs_1.createReadStream)(absolutePath);
            stream.pipe(res);
        }
    }
    getContentType(format) {
        switch (format.toLowerCase()) {
            case 'ogg':
                return 'audio/ogg';
            case 'aac':
                return 'audio/aac';
            case 'm4a':
                return 'audio/mp4';
            case 'mp4':
                return 'audio/mp4';
            case 'wav':
                return 'audio/wav';
            case 'flac':
                return 'audio/flac';
            case 'mp3':
            default:
                return 'audio/mpeg';
        }
    }
    parseRange(rangeHeader, size) {
        const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (!matches) {
            return { start: 0, end: size - 1 };
        }
        const start = matches[1] ? parseInt(matches[1], 10) : 0;
        const end = matches[2] ? parseInt(matches[2], 10) : size - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
            return { start: 0, end: size - 1 };
        }
        return { start, end };
    }
};
exports.ShowsController = ShowsController;
__decorate([
    (0, common_1.Get)(':id/stream'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ShowsController.prototype, "streamShow", null);
exports.ShowsController = ShowsController = __decorate([
    (0, common_1.Controller)('shows'),
    __metadata("design:paramtypes", [audio_service_1.AudioService])
], ShowsController);
//# sourceMappingURL=shows.controller.js.map