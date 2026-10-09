import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PUSH_PROVIDER } from './push/push-provider.interface';
import { FcmPushProvider } from './push/fcm-push.provider';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: PUSH_PROVIDER, useClass: FcmPushProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}