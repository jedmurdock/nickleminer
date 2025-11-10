import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../database/prisma.module';
import { AudioService } from './audio.service';
import { AudioDownloadService } from './download.service';
import { AudioConvertService } from './convert.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AudioService, AudioDownloadService, AudioConvertService],
  exports: [AudioService],
})
export class AudioModule {}
