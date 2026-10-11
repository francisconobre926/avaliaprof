import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { STORAGE_PROVIDER } from '../media/storage/storage-provider.interface';
import { R2StorageProvider } from '../media/storage/r2-storage.provider';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [UsersController],
  providers: [UsersService, { provide: STORAGE_PROVIDER, useClass: R2StorageProvider }],
  exports: [UsersService],
})
export class UsersModule {}