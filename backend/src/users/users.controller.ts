import { Body, Controller, Delete, Get, HttpCode, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto, UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get() me(@CurrentUser() u: AuthUser) { return this.users.me(u.userId); }

  @Patch() update(@CurrentUser() u: AuthUser, @Body() dto: UpdateMeDto) { return this.users.update(u.userId, dto); }

  @Post('password') @HttpCode(200) password(@CurrentUser() u: AuthUser, @Body() dto: ChangePasswordDto) { return this.users.changePassword(u.userId, dto); }

  @Post('photo')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 } }))
  photo(@CurrentUser() u: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.users.setPhoto(u.userId, file);
  }

  @Delete('photo') removePhoto(@CurrentUser() u: AuthUser) { return this.users.removePhoto(u.userId); }
}
