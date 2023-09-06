import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { IUser } from 'src/auth/user.interface';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';
import { UploadsService } from 'src/uploads/uploads.service';
const bcrypt = require('bcryptjs');
import { ICart } from './cart.interface';
import { ProductsService } from 'src/products/products.service';
import e from 'express';
import { CartDto } from './dto/cart.dto';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    private uploadsService: UploadsService,
    private productsService: ProductsService,
  ) {}

  async findUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email });
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async register(user: RegisterUserDto, role: mongoose.Types.ObjectId) {
    try {
      const {password} = user;
      user.password = this.hashPassword(password);
      const newUser = await this.userModel.create({...user, role, isActive:false})
      return newUser;

    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  comparePassword(password: string, hashPassword: string) {
    return bcrypt.compareSync(password, hashPassword);
  }
  hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  updateRefreshToken(_id: string, refreshToken: string) {
    try {
      const response = this.userModel.updateOne({_id}, {refreshToken});
      return response;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async create(createUserDto: CreateUserDto, user :IUser) {
    try {
      const {password, email} = createUserDto;
      const checkEmail = await this.userModel.findOne({email});
      if(checkEmail) throw new BadRequestException('Email already exists');
      const response  = await this.userModel.create({...createUserDto, 
        password: this.hashPassword(password), createdBy: {email:user.email, _id: user._id}});

      return {
        _id:response._id,
        createdAt:response.createdAt,
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createUser(user:any) {
    try {
      const result = await this.userModel.create(user);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page: number, limit: number, query: any) {
    const limit1 = limit || 5;
    const offset = (page - 1) * limit1;
    const { filter, sort, projection, population } = aqp(query);
    delete filter.page;
    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit1);

    // Query theo title
    if(filter.name) {
      const formatTitle = {$regex: filter.name, $options: 'i'};
      filter.name = formatTitle;
    }
    
    let result = await this.userModel.find(filter).limit(limit1).skip(offset)
      // @ts-ignore:Unreachable code error
      .sort(sort).select(projection).populate(population).select(['-password', '-refreshToken']).populate({path:'role', select:'name'})
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

  async findOne(id:string) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const user = await this.userModel.findById(id).populate([{path:'role', select:'name'}, {path:'cart.product', select:'title price'}])
      .select(['-password', '-refreshToken']);
      if(!user || user.isDeleted == true) throw new BadRequestException('User not found')
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, user :IUser) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      console.log(updateUserDto);
      const response = await this.userModel.updateOne({_id: id},{...updateUserDto, updatedBy: {email:user.email, _id: user._id}});
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateCart(id: string, body : CartDto, user :IUser) {
    try {
      if(!body.cart) throw new BadRequestException('Require cart');
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const findUser = await this.userModel.findById(id);
      if(!findUser) throw new BadRequestException('User not found');
      body.cart.forEach((item: any) => {if(!item.quantity || !item.product || !item.color) throw new BadRequestException('Missing input')})
      // Handle cart
      let oldCart = findUser.cart;
      for(let i = 0; i < body.cart.length; i++) {
        
        let index = oldCart.findIndex(item => item.product == body.cart[i].product && item.color == body.cart[i].color);
        if(index != -1) {
          oldCart[index].quantity += body.cart[i].quantity;
        } else {
          oldCart.push(body.cart[i]);
        }
      }
      const response = await this.userModel.updateOne({_id: id},{cart:oldCart, updatedBy: {email:user.email, _id: user._id}});
      return {
        cart: oldCart,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteCart(id: string, body : CartDto, user :IUser) {
    try {
      if(!body.cart) throw new BadRequestException('Require cart');
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const findUser = await this.userModel.findById(id);
      if(!findUser) throw new BadRequestException('User not found');
      body.cart.forEach((item: any) => {if(!item.quantity || !item.product || !item.color) throw new BadRequestException('Missing input')})
      
      // Handle cart
      let oldCart = findUser.cart;
      for(let i = 0; i < body.cart.length; i++) {
        let index = oldCart.findIndex(item => item.product == body.cart[i].product && item.color == body.cart[i].color);
        if(index != -1) {
          if(oldCart[index].quantity > body.cart[i].quantity) {
            oldCart[index].quantity -= body.cart[i].quantity;
          } else {
            oldCart.splice(index,1);
          }
        } 
      }
      const response = await this.userModel.updateOne({_id: id},{cart:oldCart, updatedBy: {email:user.email, _id: user._id}});
      return {
        cart: oldCart,
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, user :IUser) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const findUser = await this.userModel.findById(id);
      if(!findUser) throw new BadRequestException('User not found');
      // Delete image in AWS
      await this.uploadsService.deleteSingleFile(findUser.image);

      const response = await this.userModel.updateOne({_id: id},{deletedBy: {email:user.email, _id: user._id}, image: ''});
      return this.userModel.softDelete({_id: id});
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateChangeToken(id: any,changePasswordToken: string) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const response = await this.userModel.updateOne({_id: id},{
        passwordResetToken: changePasswordToken,
      });
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updatePassword(id:any,password: string) {
    try {
      if(!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
      const response = await this.userModel.updateOne({_id: id},{
        password: this.hashPassword(password),
        passwordResetToken: '',
      });
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateUser(id:any,update:any) {
    try {
      const response = await this.userModel.updateOne({_id: id},update);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateImage(url: string, id: string, user :IUser) {
    try {
      const findUser = await this.userModel.findById(id);
      if(!findUser) throw new BadRequestException('User not found');
      const response = await this.userModel.updateOne({_id: id}, {image: url, updatedBy: {email:user.email, _id: user._id}});
      return {
        image: url,
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addWishList(productId: string, user :IUser) {
    try {
      const findProduct = await this.productsService.findOne(productId);
      if(!findProduct) throw new BadRequestException('Product not found');
      const findUser = await this.userModel.findById(user._id);
      let oldWishList = findUser.wishList.map(item => item.toString());
      let wishList= new Set([...oldWishList, productId]) ?? [];
      console.log(oldWishList);

      await this.userModel.updateOne({_id: user._id}, {wishList: [...wishList], updatedBy: {email:user.email, _id: user._id}});
      return {
        wishList: [...wishList],
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteWishList(productId: string, user :IUser) {
    try {
      const findProduct = await this.productsService.findOne(productId);
      if(!findProduct) throw new BadRequestException('Product not found');
      const findUser = await this.userModel.findById(user._id);
      let wishList = findUser.wishList.map(item => item.toString());

      let index = wishList.findIndex(item => item == productId);
      if(index != -1) {
        wishList.splice(index,1);
      } else {
        throw new BadRequestException('Product not found in wishList');
      }
      console.log(wishList);

      await this.userModel.updateOne({_id: user._id}, {wishList: [...wishList], updatedBy: {email:user.email, _id: user._id}});
      return {
        wishList: [...wishList],
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
