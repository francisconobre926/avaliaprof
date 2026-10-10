import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SearchRequestsService } from './search-requests.service';
import { SearchRequestsController } from './search-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SearchRequestsController],
  providers: [SearchRequestsService],
  exports: [SearchRequestsService],
})
export class SearchRequestsModule {}