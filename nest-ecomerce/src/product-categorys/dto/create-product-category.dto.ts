
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, } from 'class-validator';

export class CreateProductCategoryDto {
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @ApiProperty()
    @IsOptional()
    description: string;


    @ApiProperty()
    @IsOptional()
    brand: string[];
}


