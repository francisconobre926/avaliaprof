import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../media/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}