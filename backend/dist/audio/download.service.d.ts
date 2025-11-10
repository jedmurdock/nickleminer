import { ConfigService } from '@nestjs/config';
import { Show } from '@prisma/client';
export interface DownloadResult {
    absolutePath: string;
    relativePath: string;
    format: string;
    skipped: boolean;
}
export declare class AudioDownloadService {
    private readonly configService;
    private readonly logger;
    private readonly storageRoot;
    private readonly rawDir;
    constructor(configService: ConfigService);
    download(show: Show): Promise<DownloadResult>;
    private ensureDirectories;
    private fileExists;
    private inferExtension;
}
