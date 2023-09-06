import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({timestamps: true})
export class Blog {
	@Prop({required: true})
  title: string;

  @Prop()
  description: string;

  @Prop({default: 0})
  views: number;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory'})
  category: mongoose.Schema.Types.ObjectId;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'User'})
  author: mongoose.Schema.Types.ObjectId;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'User'})
  likes: mongoose.Schema.Types.ObjectId[];

  @Prop()
  image: string;

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

export const BlogSchema = SchemaFactory.createForClass(Blog);