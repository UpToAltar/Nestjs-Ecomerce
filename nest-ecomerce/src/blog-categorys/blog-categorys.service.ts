import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BlogCategory, BlogCategoryDocument } from './schemas/blog-category.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/auth/user.interface';
import aqp from 'api-query-params';

@Injectable()
export class BlogCategorysService {
  constructor(@InjectModel(BlogCategory.name) private blogCategoryModel: SoftDeleteModel<BlogCategoryDocument>,) {}

  async create(createBlogCategoryDto: CreateBlogCategoryDto, user :IUser) {
    try {
      const checkCategory = await this.blogCategoryModel.findOne({name: createBlogCategoryDto.name});
      if(checkCategory) throw new BadRequestException('Category already exists');
      const category = await this.blogCategoryModel.create({...createBlogCategoryDto, createdBy: {email:user.email, _id: user._id}});
      return category ;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.blogCategoryModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.name) {
      const formatTitle = {$regex: filter.name, $options: 'i'};
      filter.name = formatTitle;
    }
    
    let result = await this.blogCategoryModel.find(filter).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population)
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
      const category = await this.blogCategoryModel.findById(id);
      if(!category || category.isDeleted == true) throw new BadRequestException('Category not found')
      return category;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateBlogCategoryDto: UpdateBlogCategoryDto, user :IUser) {
    try {
      const category = await this.blogCategoryModel.findById(id);
      if(!category) throw new BadRequestException('Category not found');
      const response = await this.blogCategoryModel.updateOne({_id: id}, {...updateBlogCategoryDto, updatedBy: {email:user.email, _id: user._id}});
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      const category = await this.blogCategoryModel.findById(id);
      if(!category) throw new BadRequestException('Category not found');
      const response = await this.blogCategoryModel.updateOne({_id: id}, {deletedBy: {email:user.email, _id: user._id}});
      return this.blogCategoryModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  
}
