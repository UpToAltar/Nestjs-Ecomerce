import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './schemas/blog.schema';
import { IUser } from 'src/auth/user.interface';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { S3 } from "aws-sdk";
import { ConfigService } from '@nestjs/config';
import { kMaxLength } from 'buffer';
import { UploadsService } from 'src/uploads/uploads.service';


@Injectable()
export class BlogsService {
  constructor(@InjectModel(Blog.name) private blogModel: SoftDeleteModel<BlogDocument>,
    private configService: ConfigService,
    private uploadsService: UploadsService,
  ) {}

  async create(createBlogDto: CreateBlogDto, user :IUser) {
    try {
      const blog = await this.blogModel.create({...createBlogDto, createdBy: {email:user.email, _id: user._id}});
      return blog ;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.blogModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.title) {
      const formatTitle = {$regex: filter.title, $options: 'i'};
      filter.title = formatTitle;
    }
    
    let result = await this.blogModel.find(filter).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population).populate([
        {path: 'category', select: 'name'},
        {path: 'likes', select: 'name '},
      ])
      ;
      return {
        meta : {
          current:page,
          pageSize:limit1,
          pages:totalPages,
          total:totalItems,
        },
        result
      }
  }

  async findOne(id: string) {
    try {
      const blog = await this.blogModel.findById(id).populate([
        {path: 'category', select: 'name'},
        {path: 'likes', select: 'name '},
      ])
      if(!blog || blog.isDeleted == true) throw new BadRequestException('Blog not found')

      // Update view
      await this.blogModel.updateOne({_id: id}, {views: blog.views + 1});
      return blog;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateBlogDto: UpdateBlogDto, user :IUser) {
    try {
      const blog = await this.blogModel.findById(id);
      if(!blog) throw new BadRequestException('Blog not found');
      const response = await this.blogModel.updateOne({_id: id}, {...updateBlogDto, updatedBy: {email:user.email, _id: user._id}});
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      const blog = await this.blogModel.findById(id);
      if(!blog) throw new BadRequestException('Blog not found');
      // Delete image in AWS
      await this.uploadsService.deleteSingleFile(blog.image);
      const response = await this.blogModel.updateOne({_id: id}, {deletedBy: {email:user.email, _id: user._id}, images:""}, );
      return this.blogModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async like(user :IUser, id: string) {
    try {
      const blog = await this.blogModel.findById(id);
      if(!blog) throw new BadRequestException('Blog not found or deleted');
      const listLike = blog.likes;

      // Check user like
      const index = listLike.findIndex(item => item.toString() == user._id);
      if(index == -1) {
        
        const response = await this.blogModel.updateOne({_id: id}, {likes: [...listLike, user._id]});
      } else {
        // Remove user like
        listLike.splice(index, 1);
        const response = await this.blogModel.updateOne({_id: id}, {likes: listLike});
      }
      return index == -1 ? 'Like' : 'Unlike';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateImage(url:string, id: string, user :IUser) {
    try {
      const blog = await this.blogModel.findById(id);
      if(!blog) throw new BadRequestException('Blog not found');
      const response = await this.blogModel.updateOne({_id: id}, {images: url, updatedBy: {email:user.email, _id: user._id}});
      return {
        images: url,
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
