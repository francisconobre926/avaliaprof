import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';
import { PeriodsModule } from '../periods/periods.module';
import { TeacherScopeModule } from '../teacher-scope/teacher-scope.module';
import { EvaluationsController, TeacherInsightsController } from './evaluations.controller';
import { HomeService } from './home.service';
import { HomeController, InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { EvaluationsService } from './evaluations.service';
import { QrController, ReportsController } from './qr.controller';
import { QrService } from './qr.service';
import { StatsService } from './stats.service';

@Module({
  imports: [AuthModule, PeriodsModule, ModerationModule, TeacherScopeModule],
  controllers: [EvaluationsController, TeacherInsightsController, HomeController, InsightsController, QrController, ReportsController],
  providers: [QrService, EvaluationsService, StatsService, InsightsService, HomeService],
  exports: [StatsService],
})
export class EvaluationsModule {}
