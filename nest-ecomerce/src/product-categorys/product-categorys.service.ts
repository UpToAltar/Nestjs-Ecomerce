import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProductCategory, ProductCategoryDocument } from './schemas/product-category.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/auth/user.interface';
import aqp from 'api-query-params';

@Injectable()
export class ProductCategorysService {
  constructor(@InjectModel(ProductCategory.name) private productCategoryModel: SoftDeleteModel<ProductCategoryDocument>,) {}

  async create(createProductCategoryDto: CreateProductCategoryDto, user :IUser) {
    try {
      const checkCategory = await this.productCategoryModel.findOne({name: createProductCategoryDto.name});
      if(checkCategory) throw new BadRequestException('Category already exists');
      const category = await this.productCategoryModel.create({...createProductCategoryDto, createdBy: {email:user.email, _id: user._id}});
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
    const totalItems = await this.productCategoryModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.name) {
      const formatTitle = {$regex: filter.name, $options: 'i'};
      filter.name = formatTitle;
    }
    
    let result = await this.productCategoryModel.find(filter).limit(limit1).skip(offset)
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
      const category = await this.productCategoryModel.findById(id);
      if(!category || category.isDeleted == true) throw new BadRequestException('Category not found')
      return category;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, update: UpdateProductCategoryDto, user :IUser) {
    try {
      const category = await this.productCategoryModel.findById(id);
      if(!category) throw new BadRequestException('Category not found');
      let brand = update.brand ?  new Set([...category.brand, ...update.brand]) : category.brand;
      const response = await this.productCategoryModel.updateOne({_id: id}, {...update, brand:[...brand], updatedBy: {email:user.email, _id: user._id}});
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      const category = await this.productCategoryModel.findById(id);
      if(!category) throw new BadRequestException('Category not found');
      const response = await this.productCategoryModel.updateOne({_id: id}, {deletedBy: {email:user.email, _id: user._id}});
      return this.productCategoryModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeBrand(id: string, user :IUser, brandDetele: string) {
    try {
      if(!brandDetele) throw new BadRequestException('Brand not found');
      const category = await this.productCategoryModel.findById(id);
      if(!category) throw new BadRequestException('Category not found');
      let brand = category.brand;
      const findBrand = category.brand.indexOf(brandDetele)
      if(findBrand == -1) throw new BadRequestException('Brand not found in category');
      brand.splice(findBrand, 1);
      let response = await this.productCategoryModel.updateOne({_id: id}, {brand:[...brand], updatedBy: {email:user.email, _id: user._id}});
      return {
        brand: brand,
      }
      
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
