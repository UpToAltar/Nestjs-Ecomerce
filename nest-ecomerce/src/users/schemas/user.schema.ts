import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Product } from 'src/products/schemas/product.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({timestamps: true})
export class User {
	@Prop({required: true})
  email: string;

	@Prop()
  password: string;

  @Prop()
  address: string;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Product'})
  wishList: Product[];

  @Prop({default: true})
  isActive: boolean;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Role'})
  role: mongoose.Schema.Types.ObjectId;

  @Prop()
  refreshToken: string;

	@Prop()
  phone: string;

  @Prop({default: 'local'})
  typeLogin: string;

  @Prop()
  image: string;

  @Prop()
  name: string;

  @Prop()
  gender: string;

  @Prop()
  age: number;

  @Prop({type:[{product:{type:mongoose.Schema.Types.ObjectId , ref : "Product"}, quantity:{type:Number}, color:{type:String}}], default: []})
  cart: {
    product: mongoose.Schema.Types.ObjectId,
    quantity: number,
    color: string
  }[]

  @Prop()
  passwordChangeAt: string;

  @Prop()
  passwordResetToken: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt: Date;

  @Prop({type:Object})
  createdBy:{
    _id:mongoose.Schema.Types.ObjectId,
    email:string
  };

  @Prop({type:Object})
  updatedBy:{
    _id:mongoose.Schema.Types.ObjectId,
    email:string
  };

  @Prop({type:Object})
  deletedBy:{
    _id:mongoose.Schema.Types.ObjectId,
    email:string
  };

  @Prop()
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);