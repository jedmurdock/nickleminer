import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AudioService } from '../audio/audio.service';
import { ConfigService } from '@nestjs/config';
export declare class ProcessWorker implements OnModuleInit, OnModuleDestroy {
    private readonly queueService;
    private readonly audioService;
    private readonly configService;
    private readonly logger;
    private worker?;
    constructor(queueService: QueueService, audioService: AudioService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
}
