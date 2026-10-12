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
import { VerificationsModule } from './verifications/verifications.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpThrottlerGuard } from './common/guards/http-throttler.guard';

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
    VerificationsModule,
    PromotionsModule,
    ReferralsModule,
    AuditModule,
    AnalyticsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class AppModule {}