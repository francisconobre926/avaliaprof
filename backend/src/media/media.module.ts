import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { R2StorageProvider } from './storage/r2-storage.provider';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MediaController],
  providers: [
    MediaService,
    { provide: STORAGE_PROVIDER, useClass: R2StorageProvider },
  ],
})
export class MediaModule {}