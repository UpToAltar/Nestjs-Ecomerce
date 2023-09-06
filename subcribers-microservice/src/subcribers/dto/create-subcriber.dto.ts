import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { IUser } from "../schemas/user.interface";

export class CreateSubcriberDto {
    products: string;
    user : IUser;
}
export class CreateSubcriberDtoByAdim {
    email: string;
    name: string;
    products: string[];
}
