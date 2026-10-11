import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}