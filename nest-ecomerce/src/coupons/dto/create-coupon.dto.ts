import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, } from 'class-validator';

export class CreateCouponDto {
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsNotEmpty()
    @ApiProperty()
    description: string;

    @IsNotEmpty()
    @ApiProperty()
    discount: number;

    @IsNotEmpty()
    @ApiProperty({example: '2' , description: '2 days'})
    expiredDate: string;

}
