import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UploadsService } from 'src/uploads/uploads.service';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), ProductsModule],
  controllers: [UsersController],
  providers: [UsersService, UploadsService],
  exports: [UsersService]
})
export class UsersModule {}
