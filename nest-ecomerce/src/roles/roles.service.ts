import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import mongoose, { Model } from 'mongoose';
import { IUser } from 'src/auth/user.interface';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,) {}
  async create(createRoleDto: CreateRoleDto, user :IUser) {
    try {
      const oldRole = await this.roleModel.findOne({name: createRoleDto.name});
      if(oldRole) throw new BadRequestException('Role already exists')
      const role = await this.roleModel.create({...createRoleDto, createdBy: {email:user.email, _id: user._id}});
      return role;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.roleModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);
    
    let result = await this.roleModel.find(filter).limit(limit1).skip(offset)
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

  async findByRoleName(name1: string, name2: string) {
    try {
      const role = await this.roleModel.findOne({$or:[{name : name1},{ name: name2}]});
      return role;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string) {
    try {

      // if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const role = await this.roleModel.findById(id);
      if(!role || role.isDeleted == true) throw new BadRequestException('Role not found')
      return role;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const role = await this.roleModel.updateOne({_id: id},
        {...updateRoleDto, updatedBy: {email:user.email, _id: user._id}});
      return role;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string , user: IUser) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      await this.roleModel.updateOne({_id: id}, { deletedBy: {email:user.email, _id: user._id}});
      return this.roleModel.softDelete({_id: id});
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
