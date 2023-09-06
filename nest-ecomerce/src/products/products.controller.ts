import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IUser } from 'src/auth/user.interface';
import { ApiMultiFile, Public, ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { IRating } from './ratings.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from 'src/uploads/uploads.service';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService,
    private readonly uploadsService: UploadsService,
    ) {}

  @Post()
  @Roles(['admin'])
  @ResponseMessage('Create a product')
  create(@Body() createProductDto: CreateProductDto, @User() user : IUser) {
    return this.productsService.create(createProductDto , user);
  }

  @Post('ratings')
  @ApiBody({schema: {example: {id : 'productId', rating: 5, comment: 'Good'}}})
  @ResponseMessage('Ratings a product')
  createRating(@Body() body : IRating, @User() user : IUser) {
    return this.productsService.createRating(body, user);
  }

  @Public()
  @Get()
  @ResponseMessage('Fetch products with pagination')
  async findAll(@Query() query: any, @Query('page') page: string, @Query('limit') limit: string) {
    return this.productsService.findAll(+page, +limit, query);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch product by id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Update a product')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @User() user : IUser) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Delete a product')
  remove(@Param('id') id: string , @User() user : IUser) {
    return this.productsService.remove(id, user);
  }

  @Delete('ratings/:productId')
  @ResponseMessage('Delete a user rating of product by user')
  removeRating(@Param('productId') id: string , @User() user : IUser) {
    return this.productsService.removeRating(id, user);
  }

  @Delete('ratings/by-admin/:productId')
  @Roles(['admin'])
  @ResponseMessage('Delete a user rating of product by admin')
  removeRatingByAdmin(@Param('productId') id: string , @User()  admin: IUser, @Body('userId') userId: string) {
    if(!userId) throw new BadRequestException('Require userId');
    return this.productsService.removeRatingByAdmin(id, admin, userId);
  }

  @Post('upload/:id')
  @Roles(['admin'])
  @ApiConsumes('multipart/form-data')
  @ApiMultiFile('images')
  @Throttle(3, 60)
  @UseInterceptors(FilesInterceptor('images'))
  @ResponseMessage('Upload images')
  async uploadFile(@UploadedFiles(
    new ParseFilePipe({
      validators: [
        // Max:5MB
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5  }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    }),
  ) files: Array<Express.Multer.File>, @Param('id') id: string, @User() user: IUser) {
    if(!files){
      throw new BadRequestException('Require image files');
    }
    const product = await this.productsService.findOne(id);
    let data = [];
    for(let i = 0; i < files.length; i++){
      const upload = await this.uploadsService.uploadSingleFile(files[i].buffer, files[i].originalname, 'products', id);
      data.push(upload.fileUrl);
    }
    if(data.length != 0){
      await this.productsService.update(id, {images: [...product.images, ...data]}, user);
      return {
        images: data,
      }
    }
    
  }


  @Delete('upload/:id')
  @Roles(['admin'])
  @ApiBody({schema: {example: {images : ['link image 1 to delete', 'image2']}}})
  @Throttle(3, 60)
  @ResponseMessage('Delete images')
  async deleteFile(@Param('id') id: string, @User() user: IUser, @Body() body: any) {
    const product = await this.productsService.findOne(id);
    if(!product) throw new BadRequestException('Product not found');
    if(!body.images) throw new BadRequestException('Require Array of images ');

    // Delete image in AWS
    const upload = await this.uploadsService.deleteMultipleFile(body.images);

    // Delete image in DB and update
    const images = this.removeAfromB(body.images,product.images)

    await this.productsService.update(id, {images}, user);
    return "Delete images successfully"
    
  }

  removeAfromB(a:string[], b:string[]) {
    return b.filter(item => !a.includes(item));
  }
}
