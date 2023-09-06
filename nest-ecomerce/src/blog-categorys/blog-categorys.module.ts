import { Module } from '@nestjs/common';
import { BlogCategorysService } from './blog-categorys.service';
import { BlogCategorysController } from './blog-categorys.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogCategory, BlogCategorySchema } from './schemas/blog-category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: BlogCategory.name, schema: BlogCategorySchema }])],
  controllers: [BlogCategorysController],
  providers: [BlogCategorysService],
})
export class BlogCategorysModule {}
