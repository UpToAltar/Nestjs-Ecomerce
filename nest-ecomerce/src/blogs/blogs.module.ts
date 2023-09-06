import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { UploadsService } from 'src/uploads/uploads.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]), ],
  controllers: [BlogsController],
  providers: [BlogsService, UploadsService],
})
export class BlogsModule {}
