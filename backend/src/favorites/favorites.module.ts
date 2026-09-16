import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}