import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, SchemaTypes } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({timestamps: true})
export class Product {
	@Prop({required: true})
  title: string;

  @Prop()
  price: number;


}

export const ProductSchema = SchemaFactory.createForClass(Product);