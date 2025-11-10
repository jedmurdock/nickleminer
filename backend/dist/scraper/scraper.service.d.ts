import { PrismaService } from '../database/prisma.service';
interface ParsedShow {
    date: Date;
    playlistUrl: string;
    title?: string;
    externalId: string;
}
export declare class ScraperService {
    private prisma;
    private readonly logger;
    private readonly WFMU_BASE_URL;
    private readonly PLAYLIST_INDEX_URL;
    constructor(prisma: PrismaService);
    scrapeYear(year: number): Promise<void>;
    scrapeAndSaveShow(showInfo: ParsedShow): Promise<void>;
    private detectAudioFormats;
    private extractArchiveIds;
    private fetchArchiveMedia;
    private inferFormatFromUrl;
    private selectBestFormat;
    private extractQuality;
    private parseTrackListing;
    private parseTrackRow;
    private parseTrackDiv;
    private extractTitle;
    private parseYear;
    private delay;
    getAllShows(): Promise<({
        _count: {
            tracks: number;
        };
    } & {
        id: string;
        playlistUrl: string;
        date: Date;
        title: string | null;
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
    })[]>;
    getShow(id: string): Promise<({
        tracks: {
            id: string;
            title: string;
            createdAt: Date;
            position: number;
            artist: string;
            album: string | null;
            label: string | null;
            year: number | null;
            comments: string | null;
            showId: string;
        }[];
    } & {
        id: string;
        playlistUrl: string;
        date: Date;
        title: string | null;
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
}
export {};
