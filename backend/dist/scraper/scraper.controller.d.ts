import { ScraperService } from './scraper.service';
import { AudioService } from '../audio/audio.service';
import { ScrapeYearDto } from './dto/scrape-year.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
export declare class ScraperController {
    private readonly scraperService;
    private readonly audioService;
    constructor(scraperService: ScraperService, audioService: AudioService);
    scrapeYear(dto: ScrapeYearDto): Promise<{
        message: string;
        year: number;
    }>;
    getAllShows(pagination: PaginationDto): Promise<PaginatedResponse<any>>;
    getShow(id: string): Promise<({
        tracks: {
            id: string;
            title: string;
            createdAt: Date;
            position: number;
            showId: string;
            artist: string;
            album: string | null;
            label: string | null;
            year: number | null;
            comments: string | null;
        }[];
    } & {
        id: string;
        date: Date;
        title: string | null;
        playlistUrl: string;
        archiveUrl: string | null;
        audioFormat: string | null;
        audioPath: string | null;
        rawAudioPath: string | null;
        rawAudioFormat: string | null;
        downloadedAt: Date | null;
        convertedAt: Date | null;
        processingState: string | null;
        duration: number | null;
        processed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    processShow(id: string): Promise<{
        show: import("@prisma/client").Show;
        download: Omit<import("../audio/download.service").DownloadResult, "absolutePath">;
        conversion: Omit<import("../audio/convert.service").ConvertResult, "absolutePath">;
        message: string;
    }>;
}
