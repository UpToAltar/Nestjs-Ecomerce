import { Module } from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { DatabasesController } from './databases.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategory, ProductCategorySchema } from 'src/product-categorys/schemas/product-category.schema';
import { ProductCategorysService } from 'src/product-categorys/product-categorys.service';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import { Role, RoleSchema } from 'src/roles/schemas/role.schema';
import { BlogCategory, BlogCategorySchema } from 'src/blog-categorys/schemas/blog-category.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: ProductCategory.name, schema: ProductCategorySchema },
    { name: Product.name, schema: ProductSchema },
    { name: Role.name, schema: RoleSchema },
    { name: BlogCategory.name, schema: BlogCategorySchema },
    { name: User.name, schema: UserSchema }
  ]),
  UsersModule,
],
  controllers: [DatabasesController],
  providers: [DatabasesService],
})
export class DatabasesModule {}
