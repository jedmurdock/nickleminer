import { ConfigService } from '@nestjs/config';
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
    private readonly configService;
    private readonly logger;
    private readonly storageRoot;
    constructor(prisma: PrismaService, downloadService: AudioDownloadService, convertService: AudioConvertService, configService: ConfigService);
    processShow(showId: string): Promise<ProcessResult>;
    getStreamPath(showId: string): Promise<{
        absolutePath: string;
        format: string;
        size: number;
    }>;
    private getStorageRoot;
}
export {};
