import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateOrderDto, UserCreateDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IUser } from 'src/auth/user.interface';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/users/users.service';
import mongoose, { ObjectId } from 'mongoose';
import { CouponsService } from 'src/coupons/coupons.service';
import { find } from 'rxjs';
import aqp from 'api-query-params';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: SoftDeleteModel<OrderDocument>,
    private usersService: UsersService,
    private couponsService: CouponsService,
    private productsService: ProductsService,
  ) {}
  async create(createOrderDto: UserCreateDto, user: IUser) {
    try {
      const findUser = await this.usersService.findOne(user._id);
      if(!findUser.address) throw new BadRequestException('Please add address');
      let cart = findUser.cart as unknown as {
        product: {
          _id: string,
          price: number,
          title: string,
        },
        quantity: number,
        color: string,
      }[]
      let products = cart.map(item => ({
        product: item.product._id,
        count: item.quantity,
        color: item.color,
      }))

      // Check coupon
      let discount = 0;
      if(createOrderDto.coupon){
        const coupon = await this.couponsService.findOne(createOrderDto.coupon.toString());
        if(!coupon) throw new BadRequestException('Coupon not found');
        if(coupon.expiredDate < new Date()) throw new BadRequestException('Coupon expired');
        discount = coupon.discount;
      }
      // Tính tổng tiền

      const total = cart.reduce((acc, item) => { return acc + item.quantity * item.product.price}, 0);
      const totalAfterDiscount = (total - total * discount / 100).toFixed(1);

      const order = await this.orderModel.create({...createOrderDto,
        orderBy:user._id,
        address:findUser.address,
        products,
        total : totalAfterDiscount,
        createdBy: {email:user.email, _id: user._id},
      })

      return order;


    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createByAdmin(createOrderDto: CreateOrderDto, admin: IUser, userId: string) {
    try {
      const findUser = await this.usersService.findOne(userId);
      if(!findUser.address) throw new BadRequestException('Please add address');
      let products = createOrderDto.products
      let data = [];
      for(let i = 0; i < products.length; i++){
        const response = await this.productsService.findOne(products[i].product.toString());
        data.push({product: {price:response.price, _id:response._id, title:response.title}, count: products[i].count, color: products[i].color})
      }

      // Check coupon
      let discount = 0;
      if(createOrderDto.coupon){
        const coupon = await this.couponsService.findOne(createOrderDto.coupon.toString());
        console.log(new Date());
        if(coupon.expiredDate < new Date()) throw new BadRequestException('Coupon expired');
        discount = coupon.discount;
      }
      // Tính tổng tiền

      const total = data.reduce((acc, item) => { return acc + item.count * item.product.price}, 0);
      const totalAfterDiscount = (total - total * discount / 100).toFixed(1);

      const order = await this.orderModel.create({...createOrderDto,
        orderBy:userId,
        address:findUser.address,
        products,
        total : totalAfterDiscount,
        createdBy: {email:admin.email, _id: admin._id},
      })

      return order;

    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.orderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);
    
    let result = await this.orderModel.find(filter).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population).populate(
        [{path: 'orderBy', select: 'name email'}, 
        {path: 'coupon', select: 'title discount expiredDate description'},
        {path: 'products.product', select: 'title price '}
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

  async findByUser(id: string,page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.orderModel.countDocuments({...filter, orderBy: id});
    const totalPages = Math.ceil(totalItems / limit1);
    
    let result = await this.orderModel.find({orderBy:id}).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population).populate(
        [{path: 'orderBy', select: 'name email'}, 
        {path: 'coupon', select: 'title discount expiredDate description'},
        {path: 'products.product', select: 'title price '}
      ])
      ;
      return {
        meta : {
          current:page || 1,
          pageSize:limit1,
          pages:totalPages,
          total:totalItems,
        },
        result
      }
  }

  async findOne(id: string) {
    try {
      const order = await this.orderModel.findById(id).populate(
        [{path: 'orderBy', select: 'name email'}, 
        {path: 'coupon', select: 'title discount expiredDate description'},
        {path: 'products.product', select: 'title price '}
      ])
      if(!order || order.isDeleted == true) throw new BadRequestException('Order not found')
      return order;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user : IUser) {
    try {
      const order = await this.orderModel.findById(id).populate({path: 'products.product', select: 'title price'});
      if(!order) throw new BadRequestException('Order not found');
    
      let products = order.products as unknown as {
        product: {
            _id: string,
            price: number,
            title: string,
          },
          count: number,
          color: string,
      }[];
      let total = products.reduce((acc, item) => { return acc + item.count * item.product.price}, 0);
      if(updateOrderDto.products){
        const arr = updateOrderDto.products
        let products = [];
        for(let i = 0; i < arr.length; i++){
          const response = await this.productsService.findOne(arr[i].product.toString());
          products.push({product: {price:response.price}, count: arr[i].count, color: arr[i].color})
        }
        total = products.reduce((acc, item) => { return acc + item.count * item.product.price}, 0);
      }
      // Update coupon
      let discount = 0;
      if(updateOrderDto.coupon){
        console.log(1);
        let coupon = await this.couponsService.findOne(updateOrderDto.coupon.toString());
        if(!coupon) throw new BadRequestException('Coupon not found');
        if(coupon.expiredDate < new Date()) throw new BadRequestException('Coupon expired');
        discount = coupon.discount;
      } else {
        const oldDiscount = await this.couponsService.findOne(order.coupon.toString());
        discount = oldDiscount.discount;
      }
      
      const totalAfterDiscount = (total - total * discount / 100).toFixed(1);
      await this.orderModel.updateOne({_id: id}, {...updateOrderDto, total: totalAfterDiscount, updatedBy: {email:user.email, _id: user._id}});

      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      const order = await this.orderModel.findById(id);
      if(!order) throw new BadRequestException('Order not found');
      const response = await this.orderModel.updateOne({_id: id}, {deletedBy: {email:user.email, _id: user._id}});
      return this.orderModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeCoupon(id: string, user :IUser) {
    try {
      const order = await this.orderModel.findById(id)
      if(!order) throw new BadRequestException('Order not found');
      const coupon = order.coupon ?  await this.couponsService.findOne(order.coupon.toString()) : null;

      const discount = coupon?.discount ?? 0;
      let total = order.total *100 / (100 - discount);
      const response = await this.orderModel.updateOne({_id: id}, {
        total,
        coupon: null,
        updatedBy: {email:user.email, _id: user._id}});
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
