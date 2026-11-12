import { Module } from '@nestjs/common';
import { TeacherScopeService } from './teacher-scope.service';

@Module({ providers: [TeacherScopeService], exports: [TeacherScopeService] })
export class TeacherScopeModule {}
