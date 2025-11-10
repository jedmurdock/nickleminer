import { PrismaService } from '../database/prisma.service';
import { AudioDownloadService, DownloadResult } from './download.service';
import { AudioConvertService, ConvertResult } from './convert.service';
import { Show } from '@prisma/client';
interface ProcessResult {
    show: Show;
    download: Omit<DownloadResult, 'absolutePath'>;
    conversion: Omit<ConvertResult, 'absolutePath'>;
}
export declare class AudioService {
    private readonly prisma;
    private readonly downloadService;
    private readonly convertService;
    private readonly logger;
    constructor(prisma: PrismaService, downloadService: AudioDownloadService, convertService: AudioConvertService);
    processShow(showId: string): Promise<ProcessResult>;
}
export {};
