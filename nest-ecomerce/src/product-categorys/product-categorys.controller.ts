import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductCategorysService } from './product-categorys.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { IUser } from 'src/auth/user.interface';
import { Public, ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('product-categorys')
@Controller('product-categorys')
export class ProductCategorysController {
  constructor(private readonly productCategorysService: ProductCategorysService) {}

  @Post()
  @Roles(['admin'])
  @ResponseMessage('Create a product category')
  create(@Body() createProductCategoryDto: CreateProductCategoryDto, @User() user : IUser) {
    return this.productCategorysService.create(createProductCategoryDto,user);
  }

  @Public()
  @Get()
  @ResponseMessage('Fetch product categorys with pagination')
  findAll(@Query('page') page: string, @Query('limit') limit: string, @Query() query: any) {
    return this.productCategorysService.findAll(+page, +limit, query);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch a product category by id')
  findOne(@Param('id') id: string) {
    return this.productCategorysService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Update a product category')
  update(@Param('id') id: string, @Body() updateProductCategoryDto: UpdateProductCategoryDto, @User() user : IUser) {
    return this.productCategorysService.update(id, updateProductCategoryDto,user);
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Delete a product category')
  remove(@Param('id') id: string, @User() user : IUser) {
    return this.productCategorysService.remove(id,user);
  }

  @Delete('brand/:id')
  @ApiBody({schema: {example: {brand : 'brandName'}}})
  @Roles(['admin'])
  @ResponseMessage('Delete a brand of category')
  removeBrand(@Param('id') id: string, @User() user : IUser, @Body('brand') brand: string) {
    return this.productCategorysService.removeBrand(id,user,brand);
  }
}
