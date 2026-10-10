import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}