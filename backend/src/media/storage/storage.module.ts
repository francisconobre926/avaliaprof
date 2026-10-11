import { Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import { R2StorageProvider } from './r2-storage.provider';

@Module({
  providers: [{ provide: STORAGE_PROVIDER, useClass: R2StorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}