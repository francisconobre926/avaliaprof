import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminClassGroupsService } from './admin-class-groups.service';
import { AdminPanelService } from './admin-panel.service';
import { AdminStudentsService } from './admin-students.service';
import { AuditInterceptor } from './audit.interceptor';
import { AdminController } from './admin.controller';

@Module({ imports: [AuthModule], controllers: [AdminController], providers: [AdminStudentsService, AdminClassGroupsService, AdminPanelService, AuditInterceptor] })
export class AdminModule {}
