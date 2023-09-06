import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, } from 'class-validator';

export class VerifyEmail {
    @IsNotEmpty()
    @ApiProperty()
    email: string;
}
export class VerifyPassword {
    @IsNotEmpty()
    @ApiProperty()
    password: string;
}
