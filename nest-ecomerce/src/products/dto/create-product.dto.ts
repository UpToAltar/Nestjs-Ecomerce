import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsMongoId, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, ValidateNested, isNotEmpty } from 'class-validator';
import mongoose, { SchemaTypes } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';


export class CreateProductDto {
    @IsNotEmpty()
    @ApiProperty()
    title: string;

    @ApiProperty({required:false})
    slug: string;

    @IsNotEmpty()
    @ApiProperty()
    @IsArray()
    description: string[];

    @IsNotEmpty()
    @ApiProperty()
    brand: string;

    @ApiProperty({example: '60f1b0b9e1b9f1b0b9e1b9f1'})
    @IsNotEmpty()
    category: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty()
    @ApiProperty()
    price: number;

    @IsNotEmpty()
    @ApiProperty()
    quantity: number;
    
    @ApiProperty({required:false})
    @IsOptional()
    sold: number;

    @ApiProperty({required:false})
    @IsOptional()
    colors: string[];

    @ApiProperty({required:false, example : {
        DESCRIPTION:'string',
        WARRANTY:'string',
        DELIVERY:'string',
        PAYMENT:'string',
    }})
    @IsOptional()
    informations: {
        DESCRIPTION:string,
        WARRANTY:string,
        DELIVERY:string,
        PAYMENT:string,
    };

    @ApiProperty({required:false})
    @IsOptional()
    images: string[];

}

