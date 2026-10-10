import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { ListingsModule } from './listings/listings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { UnlocksModule } from './unlocks/unlocks.module';
import { MediaModule } from './media/media.module';
import { ChatsModule } from './chats/chats.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PricingModule } from './pricing/pricing.module';
import { PublicationsModule } from './publications/publications.module';
import { ReportsModule } from './reports/reports.module';
import { SearchRequestsModule } from './search-requests/search-requests.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    CategoriesModule,
    ListingsModule,
    FavoritesModule,
    UnlocksModule,
    MediaModule,
    ChatsModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    PublicationsModule,
    ReportsModule,
    SearchRequestsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}