import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateSubcriberDtoByAdmin {
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({example: 'user1@gmail.com', description: 'email'})
    email: string;

    @IsNotEmpty()
    @ApiProperty({example: 'name', description: 'Password'})
    name: string;

    @IsNotEmpty()
    @ApiProperty({example:'5f9d3b9b9d9d9d9d9d9d9d9d', description: 'Product ID'})
    products: string;
}

export class CreateSubcriberDto{
    @IsNotEmpty()
    @ApiProperty({example: '5f9d3b9b9d9d9d9d9d9d9d9d', description: 'Product ID'})
    products: string;
}