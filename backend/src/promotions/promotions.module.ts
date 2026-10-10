import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { AdminPromotionsController } from './admin-promotions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PromotionsController, AdminPromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}