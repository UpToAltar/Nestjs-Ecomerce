import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, UseInterceptors, UploadedFile,BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiFile, Public, ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { IUser } from 'src/auth/user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from 'src/uploads/uploads.service';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CartDto } from './dto/cart.dto';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly uploadsService: UploadsService,
    ) {}

  @Post()
  @Roles(['admin', 'moderator'])
  @ResponseMessage('Create a user')
  create(@Body() createUserDto: CreateUserDto, @User() user : IUser) {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @ResponseMessage('Fetch users with pagination')
  findAll(@Query() query: any, @Query('page') page: string, @Query('limit') limit: string) {
    return this.usersService.findAll(+page, +limit, query);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch user by id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Update a user')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User() user : IUser) {
    return this.usersService.update(id, updateUserDto,user);
  }

  @Patch('/cart/:id')
  @ResponseMessage('Update cart for user')
  updateCart(@Param('id') id: string, @Body() cart : CartDto, @User() user : IUser) {
    return this.usersService.updateCart(id, cart,user);
  }

  @Delete('/cart/:id')
  @ResponseMessage('Update cart for user')
  deleteCart(@Param('id') id: string, @Body() cart: CartDto, @User() user : IUser) {
    return this.usersService.deleteCart(id, cart,user);
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Delete a user')
  remove(@Param('id') id: string, @User() user : IUser) {
    return this.usersService.remove(id, user);
  }

  @Post('wishlist/add')
  @ResponseMessage('Add product to wishlist')
  @ApiBody({schema: {example: {productId: "60f1b0b9e1b9f1b0b9e1b9f1"}}})
  wishListAdd( @User() user : IUser , @Body('productId') id: string) {
    return this.usersService.addWishList(id, user);
  }

  @Delete('wishlist/delete')
  @ResponseMessage('Delete product of wishlist')
  @ApiBody({schema: {example: {productId: "60f1b0b9e1b9f1b0b9e1b9f1"}}})
  wishListDelete( @User() user : IUser , @Body('productId') id: string) {
    return this.usersService.deleteWishList(id, user);
  }

  @Post('upload/:id')
  @Throttle(3, 60)
  @ResponseMessage('Upload image for user')
  @ApiConsumes('multipart/form-data')
  @ApiFile('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadFile(@UploadedFile(
    new ParseFilePipe({
      validators: [
        // Max:5MB
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5  }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    }),
  ) file: Express.Multer.File, @Param('id') id: string, @User() user: IUser) {
    const upload = await this.uploadsService.uploadSingleFile(file.buffer, file.originalname, 'users', id);
    if(upload) {
      return this.usersService.updateImage(upload.fileUrl, id, user);
    } else {
      throw new Error('Upload failed');
    }
  }

  @Patch('upload/:id')
  @ApiConsumes('multipart/form-data')
  @ApiFile('image')
  @Throttle(3, 60)
  @ResponseMessage('Update image for user')
  @UseInterceptors(FileInterceptor('image'))
  async updateFile(@UploadedFile(
    new ParseFilePipe({
      validators: [
        // Max:5MB
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5  }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    }),
  ) file: Express.Multer.File, @Param('id') id: string, @User() user: IUser) {
    if(!file) throw new BadRequestException('Require image');
    // Delete old image
    const findUser = await this.usersService.findOne(id);
    if(findUser.image) {
      await this.uploadsService.deleteSingleFile(findUser.image);
    }

    // Upload new image
    const upload = await this.uploadsService.uploadSingleFile(file.buffer, file.originalname, 'users', id);
    if(upload) {
      return this.usersService.updateImage(upload.fileUrl, id, user);
    } else {
      throw new Error('Upload failed');
    }
  }

  @Delete('upload/:id')
  @Throttle(3, 60)
  @ResponseMessage('Delete image user')
  @ApiBody({schema: {example: {fileName: "link image"}}})
  async deleteFile( @Param('id') id: string, @Body() body: any, @User() user: IUser) {
    if(!body.fileName) throw new BadRequestException('Require fileName');
    const upload = await this.uploadsService.deleteSingleFile(body.fileName);
    await this.usersService.updateImage('', id,user);
    return "Delete image successfully"
  }
}
