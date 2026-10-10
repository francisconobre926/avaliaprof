import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { VerificationsService } from './verifications.service';
import { VerificationsController } from './verifications.controller';
import { AdminVerificationsController } from './admin-verifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [VerificationsController, AdminVerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService],
})
export class VerificationsModule {}