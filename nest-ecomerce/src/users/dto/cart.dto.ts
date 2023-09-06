import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ArrayMinSize, IsArray, IsOptional } from 'class-validator';
import mongoose from 'mongoose';
export class CartDto {
    @IsOptional()
    @ApiProperty({required:false, example: [{product: "60f1b0b9e1b9f1b0b9e1b9f1", quantity: 1, color: "red"}]})
    @IsArray()
    @ArrayMinSize(1)
    cart: {
        product:mongoose.Schema.Types.ObjectId,
        quantity: number
        color: string
    }[]
}