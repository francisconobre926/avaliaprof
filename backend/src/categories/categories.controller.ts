import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@Controller('categories')
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,
    private audit: AuditService,
  ) {}

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // a ordem importa: o JWT preenche o request.user
  @Roles(Role.ADMIN)
  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto.name);
    await this.audit.log(req.user.userId, 'CATEGORY_CREATED', 'Category', category.id, {
      name: category.name,
    });
    return category;
  }
}