import { Module } from '@nestjs/common';
import { ShowsController } from './shows.controller';
import { AudioModule } from '../audio/audio.module';

@Module({
  imports: [AudioModule],
  controllers: [ShowsController],
})
export class ShowsModule {}
