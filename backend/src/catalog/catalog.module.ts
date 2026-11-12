import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { TeacherScopeModule } from '../teacher-scope/teacher-scope.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({ imports: [AuthModule, EvaluationsModule, TeacherScopeModule], controllers: [CatalogController], providers: [CatalogService] })
export class CatalogModule {}
