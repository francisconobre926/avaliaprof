import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../media/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}