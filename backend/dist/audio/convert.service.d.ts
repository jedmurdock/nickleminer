import { ConfigService } from '@nestjs/config';
export interface ConvertResult {
    absolutePath: string;
    relativePath: string;
    format: string;
    skipped: boolean;
}
export declare class AudioConvertService {
    private readonly configService;
    private readonly logger;
    private readonly storageRoot;
    private readonly convertedDir;
    private readonly ffmpegBinary;
    constructor(configService: ConfigService);
    convert(showId: string, inputPath: string): Promise<ConvertResult>;
    private ensureDirectories;
    private fileExists;
    private runFfmpeg;
}
