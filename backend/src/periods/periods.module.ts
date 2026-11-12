import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PeriodsController } from './periods.controller';
import { PeriodsService } from './periods.service';

@Module({ imports: [AuthModule], controllers: [PeriodsController], providers: [PeriodsService], exports: [PeriodsService] })
export class PeriodsModule {}
