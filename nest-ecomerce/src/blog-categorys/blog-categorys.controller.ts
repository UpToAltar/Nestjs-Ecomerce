import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BlogCategorysService } from './blog-categorys.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { IUser } from 'src/auth/user.interface';
import { Public, ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('blog-categorys')
@Controller('blog-categorys')
export class BlogCategorysController {
  constructor(private readonly blogCategorysService: BlogCategorysService) {}

  @Post()
  @Roles(['admin'])
  @ResponseMessage('Create a blog category')
  create(@Body() createBlogCategoryDto: CreateBlogCategoryDto, @User() user : IUser) {
    return this.blogCategorysService.create(createBlogCategoryDto,user);
  }

  @Public()
  @Get()
  @ResponseMessage('Fetch blog categorys with pagination')
  findAll(@Query('page') page: string, @Query('limit') limit: string, @Query() query: any) {
    return this.blogCategorysService.findAll(+page, +limit, query);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch a blog category by id')
  findOne(@Param('id') id: string) {
    return this.blogCategorysService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Update a blog category')
  update(@Param('id') id: string, @Body() updateBlogCategoryDto: UpdateBlogCategoryDto, @User() user : IUser) {
    return this.blogCategorysService.update(id, updateBlogCategoryDto,user);
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Delete a blog category')
  remove(@Param('id') id: string, @User() user : IUser) {
    return this.blogCategorysService.remove(id,user);
  }
}
