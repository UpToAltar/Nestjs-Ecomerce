import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UserCreateDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { IUser } from 'src/auth/user.interface';
import { query } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ResponseMessage("Create user order by user")
  create(@Body() createOrderDto: UserCreateDto, @User() user: IUser) {
    return this.ordersService.create(createOrderDto, user);
  }

  @Post('by-admin/:userId')
  @Roles(['admin'])
  @ResponseMessage("Create order for user by admin")
  createByAdmin(@Body() createOrderDto: CreateOrderDto, @User() admin: IUser, @Param('userId') userId: string) {
    return this.ordersService.createByAdmin(createOrderDto, admin, userId);
  }

  @Get()
  @Roles(['admin'])
  @ResponseMessage("Fetch orders with pagination")
  findAll(@Query() query: any, @Query('page') page: string, @Query('limit') limit: string) {
    return this.ordersService.findAll(+page, +limit, query);
  }

  @Get(':id')
  @ResponseMessage("Fetch order by id")
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post('user')
  @ResponseMessage("Fetch order of user")
  findByUser(@User() user: IUser, @Query('page') page: string, @Query('limit') limit: string) {
    return this.ordersService.findByUser(user._id, +page, +limit, query);
  }

  @Patch(':id')
  @ResponseMessage("Update order by id")
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @User() user : IUser) {
    return this.ordersService.update(id, updateOrderDto, user);
  }

  @Delete(':id')
  @ResponseMessage("Delete order by id")
  remove(@Param('id') id: string, @User() user : IUser) {
    return this.ordersService.remove(id,user);
  }

  @Delete('coupon/:id')
  @ResponseMessage("Delete coupon of order")
  removeCoupon(@Param('id') id: string, @User() user : IUser) {
    return this.ordersService.removeCoupon(id,user);
  }
}
