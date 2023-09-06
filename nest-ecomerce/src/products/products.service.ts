import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IUser } from 'src/auth/user.interface';
import { Product, ProductDocument } from './schemas/product.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import slugify from 'slugify';
import aqp from 'api-query-params';
import { IRating } from './ratings.interface';
import e from 'express';
import mongoose, { ObjectId } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: SoftDeleteModel<ProductDocument>,) {}

  async create(createProductDto: CreateProductDto, user :IUser) {
    try {
      const slug = slugify(createProductDto.title)
      createProductDto.slug = slug;
      
      const checkOldProduct = await this.productModel.findOne({slug});
      if(checkOldProduct) throw new BadRequestException('Product already exists');
      const product = await this.productModel.create({...createProductDto, createdBy: {email:user.email, _id: user._id}});
      return product ;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.productModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.name) {
      const formatTitle = {$regex: filter.name, $options: 'i'};
      filter.name = formatTitle;
    }
    
    let result = await this.productModel.find(filter).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population).populate(
        [{path: 'ratings.postedBy', select: 'name email image'}, 
        {path: 'category', select: 'name'}
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
      const product = await this.productModel.findById(id).populate(
        [{path: 'ratings.postedBy', select: 'name email image'}, 
        {path: 'category', select: 'name'}
      ])
      if(!product || product.isDeleted == true) throw new BadRequestException('Product not found')
      return product;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user :IUser) {
    try {
      const product = await this.productModel.findById(id);
      if(!product) throw new BadRequestException('Product not found');
      if(updateProductDto.title) {
        const slug = slugify(updateProductDto.title)
        updateProductDto.slug = slug;
      }
      let description = updateProductDto.description ?  new Set([...product.description, ...updateProductDto.description]) : product.description;
      let colors = updateProductDto.colors ?  new Set([...product.colors, ...updateProductDto.colors]) : product.colors;
      let informations = product.informations 
      // Update informations
      if(updateProductDto.informations) {
        for(let key in updateProductDto.informations) {
          if(informations.hasOwnProperty(key)) {
            informations[key] = updateProductDto.informations[key];
          }
        }
      }
      const response = await this.productModel.updateOne({_id: id}, {
        ...updateProductDto, 
        description:[...description],
        colors:[...colors],
        informations,
        updatedBy: {email:user.email, _id: user._id}});
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      const product = await this.productModel.findById(id);
      if(!product) throw new BadRequestException('Product not found');
      const response = await this.productModel.updateOne({_id: id}, {deletedBy: {email:user.email, _id: user._id}});
      return this.productModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createRating(body : IRating, user :IUser) {
    try {
      const {id, star, comment} = body;
      const rating = {
        postedBy: user._id as unknown as ObjectId,
        star,
        comment,
        updatedAt: new Date()
      }
      // validate
      if(!id || !star || !comment) throw new BadRequestException('Missing field');
      let product = await this.productModel.findById(id);
      if(!product) throw new BadRequestException('Invalid id or product not found');

      
      // check user đã rating chưa
      const oldRating = product.ratings;
      const checkRating = oldRating.findIndex(item => item.postedBy.toString() === user._id);
      if(checkRating == -1) {
        // Nếu chưa thì tạo cái rating đó
        const response = await this.productModel.updateOne({_id: id},{
          ratings: [rating,...oldRating]
        });
      
      }else {
        // Nếu rating rồi thì update cái rating đó
        oldRating[checkRating] = rating;
        const response = await this.productModel.updateOne({_id: id},{
          ratings: oldRating
        })
      }
      product = await this.productModel.findById(id);

      // update totalRatings
      const totalRatings = product.ratings.length;
      const totalStars = product.ratings.reduce((acc, item) => acc + +item.star, 0);
      const newTotalRatings = (totalStars / totalRatings).toFixed(1);
      const response = await this.productModel.updateOne({_id: id},{
        totalRatings: newTotalRatings
      })
      
      return checkRating == -1 ? 'Crate rating success' : 'Update rating success';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeRating(id: string, user :IUser) {
    try {
      const product = await this.productModel.findById(id);
      if(!product) throw new BadRequestException('Product not found');

      const ratings = product.ratings;
      const checkRating = ratings.findIndex(item => item.postedBy.toString() === user._id);
      if(checkRating == -1) throw new BadRequestException('User not rating this product');
      ratings.splice(checkRating, 1);
      const response = await this.productModel.updateOne({_id: id},{ ratings, updatedBy: {email:user.email, _id: user._id}});
      return 'Delete rating by user success';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeRatingByAdmin(id: string, admin :IUser, userId: string) {
    try {
      const product = await this.productModel.findById(id);
      if(!product) throw new BadRequestException('Product not found');

      const ratings = product.ratings;
      const checkRating = ratings.findIndex(item => item.postedBy.toString() === userId);
      if(checkRating == -1) throw new BadRequestException('User not rating this product');
      ratings.splice(checkRating, 1);
      const response = await this.productModel.updateOne({_id: id},{ ratings, updatedBy: {email:admin.email, _id: admin._id}});
      return 'Delete rating by admin success';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
