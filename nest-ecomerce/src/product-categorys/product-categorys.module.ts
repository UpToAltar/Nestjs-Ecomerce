import { Module } from '@nestjs/common';
import { ProductCategorysService } from './product-categorys.service';
import { ProductCategorysController } from './product-categorys.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategory, ProductCategorySchema } from './schemas/product-category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProductCategory.name, schema: ProductCategorySchema }])],
  controllers: [ProductCategorysController],
  providers: [ProductCategorysService],
  exports: [ProductCategorysService]
})
export class ProductCategorysModule {}
