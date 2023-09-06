import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional } from 'class-validator';
enum OrderStatus {
    Processing = 'Processing',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @IsOptional()
    @ApiProperty({required:false})
    @IsEnum(OrderStatus)
    status: string;
}
