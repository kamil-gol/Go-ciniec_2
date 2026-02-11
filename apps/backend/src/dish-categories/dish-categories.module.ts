import { Module } from '@nestjs/common';
import { DishCategoriesController } from './dish-categories.controller';
import { DishCategoriesService } from './dish-categories.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DishCategoriesController],
  providers: [DishCategoriesService],
  exports: [DishCategoriesService],
})
export class DishCategoriesModule {}
