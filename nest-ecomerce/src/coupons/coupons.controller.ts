import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ResponseMessage, User } from 'src/decorator/customzie.decorator';
import { IUser } from 'src/auth/user.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ResponseMessage('Create a coupon')
  create(@Body() createCouponDto: CreateCouponDto, @User() user :IUser) {
    return this.couponsService.create(createCouponDto, user);
  }

  @Get()
  @ResponseMessage('Fetch coupons with pagination')
  findAll(@Query() query: any, @Query('page') page: string, @Query('limit') limit: string) {
    return this.couponsService.findAll(+page, +limit, query);
  }

  @Get(':id')
  @ResponseMessage('Fetch coupon by id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update a coupon')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto, @User() user :IUser) {
    return this.couponsService.update(id, updateCouponDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete a coupon')
  remove(@Param('id') id: string, @User() user :IUser) {
    return this.couponsService.remove(id, user);
  }
}
