import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({timestamps: true})
export class Order {
  @Prop({
    type:[{product:{type:mongoose.Schema.Types.ObjectId , ref : "Product"}, count:{type:Number}, color:{type:String}}],
    default: []
  })
  products: {product:mongoose.Schema.Types.ObjectId,
    count:number, 
    color:string,
  }[];

  @Prop({enum : ['Processing', 'Completed', 'Cancelled'], default: 'Processing'})
  status: string;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
  orderBy: mongoose.Schema.Types.ObjectId;

  @Prop()
  total: number;

  @Prop()
  address: string;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Coupon'})
  coupon: mongoose.Schema.Types.ObjectId;

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

export const OrderSchema = SchemaFactory.createForClass(Order);