import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({timestamps: true})
export class Product {
	@Prop({required: true})
  title: string;

  // Đồng hồ apple => dong-ho-apple : link to product
	@Prop()
  slug: string;

  @Prop()
  description: string[];

  @Prop()
  brand: string;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory'})
  category: mongoose.Schema.Types.ObjectId;

  @Prop()
  price: number;

  @Prop({default: 0})
  quantity: number;

  @Prop({default: 0})
  sold: number;

  @Prop()
  images: string[];

  @Prop({default: []})
  colors: string[];

  @Prop({type:Object})
  informations : {
    DESCRIPTION:string,
    WARRANTY:string,
    DELIVERY:string,
    PAYMENT:string,
  }

  @Prop({
    type:[{star:{type:Number}, postedBy:{type:mongoose.Schema.Types.ObjectId , ref : "User"}, comment:{type:String}, updatedAt:{type:Date}}],
    default: []
  })
  ratings: {star:number, postedBy:mongoose.Schema.Types.ObjectId, comment:string, updatedAt:Date}[];


  @Prop({default: 0})
  totalRatings: number;

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

export const ProductSchema = SchemaFactory.createForClass(Product);