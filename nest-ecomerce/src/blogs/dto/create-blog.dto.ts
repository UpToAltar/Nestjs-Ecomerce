
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, } from 'class-validator';
import mongoose from 'mongoose';

export class CreateBlogDto {
    @IsNotEmpty()
    @ApiProperty()
    title: string;

    @IsNotEmpty()
    @ApiProperty()
    description: string;

    @ApiProperty({required:false})
    @IsOptional()
    view: string;

    @IsNotEmpty()
    @ApiProperty({example: '60f1b0b9e1b9f1b0b9e1b9f1'})
    category: mongoose.Schema.Types.ObjectId;

    @ApiProperty({required:false, example: '60f1b0b9e1b9f1b0b9e1b9f1'})
    @IsOptional()
    author: mongoose.Schema.Types.ObjectId;

    @ApiProperty({required:false})
    @IsOptional()
    likes: mongoose.Schema.Types.ObjectId[];

    @ApiProperty({required:false})
    @IsOptional()
    image: string;
}


