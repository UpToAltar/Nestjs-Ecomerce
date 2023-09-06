import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/auth/user.interface';
import aqp from 'api-query-params';

@Injectable()
export class CouponsService {
  constructor(@InjectModel(Coupon.name) private couponModel: SoftDeleteModel<CouponDocument>,) {}

  async create(createCouponDto: CreateCouponDto, user :IUser) {
    try {
      const checkCoupon = await this.couponModel.findOne({name: createCouponDto.name});
      if(checkCoupon) throw new BadRequestException('Coupon already exists');
      const coupon = await this.couponModel.create({...createCouponDto, createdBy: {email:user.email, _id: user._id},
        expiredDate: Date.now() + +createCouponDto.expiredDate * 24 * 60 * 60 * 1000
      });
      return coupon ;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.couponModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.name) {
      const formatTitle = {$regex: filter.name, $options: 'i'};
      filter.name = formatTitle;
    }
    
    let result = await this.couponModel.find(filter).limit(limit1).skip(offset)
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
      const coupon = await this.couponModel.findById(id);
      if(!coupon || coupon.isDeleted == true) throw new BadRequestException('Coupon not found')
      return coupon;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateCouponDto: UpdateCouponDto, user :IUser) {
    try {
      const coupon = await this.couponModel.findById(id);
      if(!coupon) throw new BadRequestException('Coupon not found');
      
      const response = await this.couponModel.updateOne({_id: id}, {...updateCouponDto, updatedBy: {email:user.email, _id: user._id} ,
        expiredDate: updateCouponDto.expiredDate ? Date.now() + +updateCouponDto.expiredDate * 24 * 60 * 60 * 1000 : coupon.expiredDate
      });
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      const coupon = await this.couponModel.findById(id);
      if(!coupon) throw new BadRequestException('Coupon not found');
      const response = await this.couponModel.updateOne({_id: id}, {deletedBy: {email:user.email, _id: user._id}});
      return this.couponModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  
}
