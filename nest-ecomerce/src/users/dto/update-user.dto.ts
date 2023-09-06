import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ArrayMinSize, IsArray, IsOptional } from 'class-validator';
import mongoose from 'mongoose';
export class Cart {
    public product:mongoose.Schema.Types.ObjectId
    public quantity: number
    public color: string
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @ApiProperty({required:false, type: [Cart], example: [{product: "60f1b0b9e1b9f1b0b9e1b9f1", quantity: 1, color: "red"}]})
    @IsArray()
    @ArrayMinSize(1)
    cart: Cart[]
}
