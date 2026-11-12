import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import { TeachersQueryDto } from './dto/teachers-query.dto';

@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  /** Já não é público: o registo deixou de pedir o curso (vem do cadastro do administrador). */
  @UseGuards(JwtAuthGuard) @Get('courses') courses() { return this.catalog.courses(); }

  @UseGuards(JwtAuthGuard) @Get('filters') filters(@CurrentUser() u: AuthUser) { return this.catalog.filterOptions(u); }
  @UseGuards(JwtAuthGuard) @Get('teachers') teachers(@Query() q: TeachersQueryDto, @CurrentUser() u: AuthUser) { return this.catalog.teachers(q, u); }
  @UseGuards(JwtAuthGuard) @Get('teachers/:id') teacher(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.catalog.teacher(id, u); }
}
