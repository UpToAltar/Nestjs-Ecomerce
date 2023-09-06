import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubcribersService } from './subcribers.service';
import { CreateSubcriberDto } from './dto/create-subcriber.dto';
import { UpdateSubcriberDto } from './dto/update-subcriber.dto';
import { MessagePattern, Payload,Ctx,RmqContext } from '@nestjs/microservices';
import { IUser } from './schemas/user.interface';


@Controller('subcribers')
export class SubcribersController {
  constructor(private readonly subcribersService: SubcribersService) {}

  @MessagePattern('create_subcriber')
  create(@Payload() data: any) {
    return this.subcribersService.create(data, null);
  }

  @MessagePattern('create_subcriber_byAdmin')
  createByAdmin(@Payload() data: any) {
    const req = {
      products: data.products,
      user: data.user,

    }
    return this.subcribersService.create(req, data.admin);
  }

  @MessagePattern('findAll_subcriber')
  findAll(@Payload() data: {page: number, limit: number, query: any}) {
    const req = {
      page: data.page || 1,
      limit: data.limit ,
      query: data.query
    }
    return this.subcribersService.findAll(req.page, req.limit, req.query);
  }

  @MessagePattern('findOne_subcriber')
  findOne(@Payload() data: {id: string}) {
    return this.subcribersService.findOne(data.id)
  }

  @MessagePattern('update_subcriber')
  update(@Payload() data: {id: string, updateSubcriberDto: UpdateSubcriberDto, user : IUser}) {
    return this.subcribersService.update(data.id, data.updateSubcriberDto, data.user);
  }

  @MessagePattern('delete_subcriber')
  remove(@Payload() data: {id: string, user : IUser}) {
    return this.subcribersService.remove(data.id, data.user);
  }
}
