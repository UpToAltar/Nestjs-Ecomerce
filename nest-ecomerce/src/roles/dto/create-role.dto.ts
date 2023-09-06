import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import mongoose, { ObjectId } from 'mongoose';

export class CreateRoleDto {
    @IsNotEmpty({message: 'Name is required'})
    @ApiProperty()
    name: string;

    @IsNotEmpty({message: 'Description is required'})
    @ApiProperty()
    description: string;

    @IsNotEmpty({message: 'isActive is required'})
    @IsBoolean({message: 'isActive must be boolean'})
    @ApiProperty()
    isActive: boolean;

}
