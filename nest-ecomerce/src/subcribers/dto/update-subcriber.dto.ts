import { PartialType } from '@nestjs/mapped-types';
import { CreateSubcriberDtoByAdmin,  CreateSubcriberDto} from './create-subcriber.dto';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubcriberDto {

    @IsOptional()
    @ApiProperty({example: '["5f9d3b9b9d9d9d9d9d9d9d9d", "...."]', description: 'Product ID'})
    products: string[];
    
    @IsOptional()
    @ApiProperty({example: 'user1@gmail.com', description: 'email'})
    email: string;

    @IsOptional()
    @ApiProperty({example: 'name', description: 'Password'})
    name: string;
}
