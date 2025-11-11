import type { Request, Response } from 'express';
import { AudioService } from '../audio/audio.service';
export declare class ShowsController {
    private readonly audioService;
    constructor(audioService: AudioService);
    streamShow(showId: string, req: Request, res: Response): Promise<void>;
    private getContentType;
    private parseRange;
}
