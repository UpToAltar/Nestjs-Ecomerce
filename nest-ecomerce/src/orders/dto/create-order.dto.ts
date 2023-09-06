import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsMongoId, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, ValidateNested, isNotEmpty } from 'class-validator';
import mongoose, { SchemaTypes } from 'mongoose';



export class CreateOrderDto {
    @IsNotEmpty()
    @ApiProperty({example: {product: "60f1b0b9e1b9f1b0b9e1b9f1", count: 1, color: "red"}})
    products: {
        product:mongoose.Schema.Types.ObjectId,
        count:number, 
        color:string,
    }[]

    @ApiProperty({required:false, example: '60f1b0b9e1b9f1b0b9e1b9f1'})
    @IsOptional()
    coupon: mongoose.Schema.Types.ObjectId;

}

export class UserCreateDto {
    @ApiProperty({required:false, example: '60f1b0b9e1b9f1b0b9e1b9f1'})
    @IsOptional()
    coupon: mongoose.Schema.Types.ObjectId;
}

