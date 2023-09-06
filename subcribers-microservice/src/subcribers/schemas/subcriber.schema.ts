import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SubcriberDocument = HydratedDocument<Subcriber>;


@Schema({timestamps: true})
export class Subcriber {
  @Prop({required: true})
  email: string;

  @Prop()
  name: string;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Product'})
  products: mongoose.Schema.Types.ObjectId[];

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

export const SubcriberSchema = SchemaFactory.createForClass(Subcriber);