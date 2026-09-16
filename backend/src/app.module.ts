import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { ListingsModule } from './listings/listings.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    CategoriesModule,
    ListingsModule,
    FavoritesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}