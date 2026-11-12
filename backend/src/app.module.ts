import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { HttpThrottlerGuard } from './common/guards/http-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { TeacherModule } from './teacher/teacher.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { PeriodsModule } from './periods/periods.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    AdminModule,
    EnrollmentModule,
    EvaluationsModule,
    TeacherModule,
    PeriodsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: Number(process.env.RATE_LIMIT ?? 100) }]),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
  ],
})
export class AppModule {}
