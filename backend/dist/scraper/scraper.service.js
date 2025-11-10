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
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const prisma_service_1 = require("../database/prisma.service");
const path = __importStar(require("path"));
let ScraperService = ScraperService_1 = class ScraperService {
    prisma;
    logger = new common_1.Logger(ScraperService_1.name);
    WFMU_BASE_URL = 'https://wfmu.org';
    PLAYLIST_INDEX_URL = 'https://wfmu.org/playlists/ND';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async scrapeYear(year) {
        this.logger.log(`Starting scrape for year ${year}`);
        try {
            const response = await axios_1.default.get(this.PLAYLIST_INDEX_URL);
            const $ = cheerio.load(response.data);
            const shows = [];
            $('a[href*="/playlists/shows/"]').each((_, element) => {
                const href = $(element).attr('href');
                if (!href)
                    return;
                const linkText = $(element).text().toLowerCase();
                if (!linkText.includes('see the playlist') && !linkText.includes('find the show')) {
                    return;
                }
                const li = $(element).closest('li');
                const contextText = li.text().replace(/\s+/g, ' ').trim();
                const externalIdMatch = href.match(/shows\/(\d+)/);
                if (!externalIdMatch) {
                    return;
                }
                const dateMatch = contextText.match(/(\w+\s+\d{1,2},\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/);
                if (!dateMatch) {
                    return;
                }
                const parsedDate = new Date(dateMatch[0]);
                if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== year) {
                    return;
                }
                const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
                shows.push({
                    date: parsedDate,
                    playlistUrl: fullUrl,
                    title: this.extractTitle(contextText),
                    externalId: externalIdMatch[1],
                });
            });
            this.logger.log(`Found ${shows.length} shows for ${year}`);
            for (const show of shows) {
                await this.scrapeAndSaveShow(show);
                await this.delay(2000);
            }
            this.logger.log(`Completed scraping ${year}`);
        }
        catch (error) {
            this.logger.error(`Error scraping year ${year}:`, error);
            throw error;
        }
    }
    async scrapeAndSaveShow(showInfo) {
        this.logger.log(`Scraping show: ${showInfo.date.toISOString()}`);
        try {
            const existing = await this.prisma.show.findUnique({
                where: { playlistUrl: showInfo.playlistUrl },
            });
            const response = await axios_1.default.get(showInfo.playlistUrl);
            const $ = cheerio.load(response.data);
            const audioFormats = await this.detectAudioFormats($, showInfo);
            const bestFormat = this.selectBestFormat(audioFormats);
            const tracks = this.parseTrackListing($);
            if (existing) {
                const updateData = {};
                if (!existing.title && showInfo.title) {
                    updateData['title'] = showInfo.title;
                }
                if (!existing.archiveUrl && bestFormat?.url) {
                    updateData['archiveUrl'] = bestFormat.url;
                    updateData['audioFormat'] = bestFormat.format;
                }
                if (Object.keys(updateData).length > 0) {
                    await this.prisma.show.update({
                        where: { id: existing.id },
                        data: updateData,
                    });
                    this.logger.log(`Updated existing show ${existing.id} with archive URL`);
                }
                else {
                    this.logger.log(`Show already exists with archive: ${existing.id}`);
                }
                return;
            }
            const show = await this.prisma.show.create({
                data: {
                    date: showInfo.date,
                    title: showInfo.title,
                    playlistUrl: showInfo.playlistUrl,
                    archiveUrl: bestFormat?.url,
                    audioFormat: bestFormat?.format,
                    processed: false,
                    tracks: {
                        create: tracks,
                    },
                },
            });
            this.logger.log(`Saved show ${show.id} with ${tracks.length} tracks`);
        }
        catch (error) {
            this.logger.error(`Error scraping show ${showInfo.playlistUrl}:`, error);
            throw error;
        }
    }
    async detectAudioFormats($, showInfo) {
        const formats = [];
        const seen = new Set();
        const addFormat = (format) => {
            if (!seen.has(format.url)) {
                formats.push(format);
                seen.add(format.url);
            }
        };
        $('a[href$=".ogg"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
                addFormat({ format: 'ogg', url: fullUrl });
            }
        });
        $('a[href$=".m4a"], a[href$=".aac"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
                addFormat({ format: 'aac', url: fullUrl });
            }
        });
        $('a[href$=".mp3"], a[href*=".mp3?"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
                const quality = this.extractQuality(href);
                addFormat({ format: 'mp3', url: fullUrl, quality });
            }
        });
        const pageText = $.text();
        if (pageText.includes('128k MP3')) {
            const match = pageText.match(/(https?:\/\/[^\s]+\.mp3)/);
            if (match) {
                addFormat({ format: 'mp3', url: match[1], quality: '128k' });
            }
        }
        const archiveIds = this.extractArchiveIds($);
        for (const archiveId of archiveIds) {
            const archiveFormats = await this.fetchArchiveMedia(showInfo.externalId, archiveId);
            for (const archiveFormat of archiveFormats) {
                if (archiveFormat) {
                    addFormat(archiveFormat);
                }
            }
        }
        return formats;
    }
    extractArchiveIds($) {
        const archives = new Set();
        $('a[href*="flashplayer.php"]').each((_, element) => {
            const href = $(element).attr('href');
            if (!href)
                return;
            try {
                const parsed = new URL(href, this.WFMU_BASE_URL);
                const archive = parsed.searchParams.get('archive');
                if (archive) {
                    archives.add(archive);
                }
            }
            catch (error) {
            }
        });
        return Array.from(archives);
    }
    async fetchArchiveMedia(showExternalId, archiveId) {
        try {
            const archiveUrl = `${this.WFMU_BASE_URL}/archiveplayer/?archive=${archiveId}&show=${showExternalId}`;
            const response = await axios_1.default.get(archiveUrl);
            const $ = cheerio.load(response.data);
            const formats = [];
            const preferredOrder = ['ogg', 'aac', 'm4a', 'mp3', 'mp4', 'ra'];
            const sources = [];
            $('video#audio-player, audio#audio-player').each((_, element) => {
                const src = $(element).attr('src');
                if (src) {
                    sources.push(src);
                }
            });
            $('source').each((_, element) => {
                const src = $(element).attr('src');
                if (src) {
                    sources.push(src);
                }
            });
            const bodyAttr = $('body').attr('data-hls-url');
            if (bodyAttr) {
                sources.push(bodyAttr);
            }
            const seen = new Set();
            for (const src of sources) {
                const fullUrl = src.startsWith('http') ? src : new URL(src, this.WFMU_BASE_URL).toString();
                if (seen.has(fullUrl)) {
                    continue;
                }
                seen.add(fullUrl);
                const format = this.inferFormatFromUrl(fullUrl);
                formats.push({ format, url: fullUrl });
            }
            formats.sort((a, b) => preferredOrder.indexOf(a.format) - preferredOrder.indexOf(b.format));
            return formats;
        }
        catch (error) {
            this.logger.warn(`Failed to fetch archive media for ${showExternalId}/${archiveId}: ${error.message}`);
            return [];
        }
    }
    inferFormatFromUrl(url) {
        try {
            const ext = path.extname(new URL(url).pathname).toLowerCase();
            if (ext) {
                return ext.replace('.', '') || 'mp3';
            }
        }
        catch (error) {
        }
        return 'mp3';
    }
    selectBestFormat(formats) {
        if (formats.length === 0)
            return null;
        const priorities = {
            'ogg': 100,
            'aac': 90,
            'm4a': 90,
            'mp3': 80,
            'mp4': 70,
            'ra': 10,
        };
        formats.sort((a, b) => {
            const priorityDiff = (priorities[b.format] || 0) - (priorities[a.format] || 0);
            if (priorityDiff !== 0)
                return priorityDiff;
            const qualityA = parseInt(a.quality || '0', 10);
            const qualityB = parseInt(b.quality || '0', 10);
            return qualityB - qualityA;
        });
        return formats[0];
    }
    extractQuality(url) {
        const match = url.match(/(\d+k)/i);
        return match ? match[1] : undefined;
    }
    parseTrackListing($) {
        const tracks = [];
        $('table tr').each((index, element) => {
            if (index === 0)
                return;
            const $row = $(element);
            const cells = $row.find('td');
            if (cells.length >= 2) {
                const track = this.parseTrackRow($, cells);
                if (track) {
                    tracks.push({ ...track, position: index });
                }
            }
        });
        if (tracks.length === 0) {
            $('.playlist-item, .track, [class*="playlist"]').each((index, element) => {
                const $item = $(element);
                const track = this.parseTrackDiv($, $item);
                if (track) {
                    tracks.push({ ...track, position: index + 1 });
                }
            });
        }
        return tracks;
    }
    parseTrackRow($, cells) {
        const getText = (index) => $(cells[index]).text().trim();
        const artist = getText(0);
        const title = getText(1);
        if (!artist || !title)
            return null;
        return {
            position: 0,
            artist,
            title,
            album: cells.length > 2 ? getText(2) : undefined,
            label: cells.length > 3 ? getText(3) : undefined,
            year: cells.length > 4 ? this.parseYear(getText(4)) : undefined,
        };
    }
    parseTrackDiv($, $item) {
        const text = $item.text().trim();
        const match = text.match(/^(.+?)\s*[-–]\s*(.+?)$/);
        if (match) {
            return {
                position: 0,
                artist: match[1].trim(),
                title: match[2].trim(),
            };
        }
        return null;
    }
    extractTitle(text) {
        let title = text
            .replace(/(\w+\s+\d{1,2},\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/, '')
            .replace(/see the playlist/i, '')
            .replace(/listen:/i, '')
            .trim();
        return title.length > 3 ? title : undefined;
    }
    parseYear(text) {
        const match = text.match(/\b(19\d{2}|20\d{2})\b/);
        return match ? parseInt(match[1]) : undefined;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async getAllShows() {
        return this.prisma.show.findMany({
            include: {
                _count: {
                    select: { tracks: true },
                },
            },
            orderBy: { date: 'desc' },
        });
    }
    async getShow(id) {
        return this.prisma.show.findUnique({
            where: { id },
            include: {
                tracks: {
                    orderBy: { position: 'asc' },
                },
            },
        });
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map