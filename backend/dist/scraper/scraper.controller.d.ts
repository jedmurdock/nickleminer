import { ScraperService } from './scraper.service';
export declare class ScraperController {
    private readonly scraperService;
    constructor(scraperService: ScraperService);
    scrapeYear(year: number): Promise<{
        message: string;
        year: number;
    }>;
    getAllShows(): Promise<{
        count: number;
        shows: ({
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
            duration: number | null;
            processed: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
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
        duration: number | null;
        processed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}
