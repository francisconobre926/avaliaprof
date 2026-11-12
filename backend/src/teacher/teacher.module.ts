import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { ModerationModule } from '../moderation/moderation.module';
import { PeriodsModule } from '../periods/periods.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({ imports: [AuthModule, EvaluationsModule, ModerationModule, PeriodsModule], controllers: [TeacherController], providers: [TeacherService] })
export class TeacherModule {}
