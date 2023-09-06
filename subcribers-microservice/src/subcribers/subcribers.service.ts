import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateSubcriberDto } from './dto/create-subcriber.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Subcriber, SubcriberDocument } from './schemas/subcriber.schema';
import { InjectModel } from '@nestjs/mongoose';
import aqp from 'api-query-params';
import { UpdateSubcriberDto } from './dto/update-subcriber.dto';
import { IUser } from './schemas/user.interface';
import mongoose from 'mongoose';

@Injectable()
export class SubcribersService {
  constructor(@InjectModel(Subcriber.name) private subcriberModel: SoftDeleteModel<SubcriberDocument>) {}
  async create(createSubcriberDto: CreateSubcriberDto, admin: IUser) {
    try {
      const {user, products} = createSubcriberDto
      const findSubcriber = await this.subcriberModel.findOne({email: user.email})
      // Có ng sub rồi thì thêm product vào
      if(findSubcriber){
        await this.subcriberModel.updateOne({_id: findSubcriber._id}, 
          {$addToSet: {products: products}, 
          createdBy: {
            email:admin ? admin.email :user.email, 
            _id:admin ? admin._id : user._id
          }})
      } else{
        // Chưa có thì tạo mới
        await this.subcriberModel.create({
          email: user.email,
          name: user.name,
          products: [products],
          createdBy: {
            email:admin ? admin.email :user.email, 
            _id:admin ? admin._id : user._id
          }
        })
      }
      

      return await this.subcriberModel.findOne({email: user.email})

    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  async findAll(page: number = 1, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.subcriberModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.name) {
      const formatTitle = {$regex: filter.name, $options: 'i'};
      filter.name = formatTitle;
    }

    // Query theo title
    if(filter.email) {
      const formatTitle = {$regex: filter.email, $options: 'i'};
      filter.email = formatTitle;
    }
    
    let result = await this.subcriberModel.find(filter).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population).populate({path: 'products', select: 'title price'});
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
      if(!mongoose.Types.ObjectId.isValid(id)) {
        return {
          error:1,
          message: 'Invalid id'
        }
      }
      const subcriber = await this.subcriberModel.findById(id).populate({path: 'products', select: 'title price'});
      if(!subcriber || subcriber.isDeleted == true) {
        return {
          error:1,
          message: 'Subcriber Not found'
        }
      }
      return subcriber;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updatesubcriberDto:UpdateSubcriberDto, user: IUser) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)){
        return {
          error:1,
          message: 'Invalid id'
        }
      }
      const subcriber = await this.subcriberModel.updateOne({_id: id},
        {...updatesubcriberDto, updatedBy: {email:user.email, _id: user._id}});
      return subcriber;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string , user: IUser) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) {
        return {
          error:1,
          message: 'Invalid id'
        }
      }
      await this.subcriberModel.updateOne({_id: id}, { deletedBy: {email:user.email, _id: user._id}});
      return this.subcriberModel.softDelete({_id: id});
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
