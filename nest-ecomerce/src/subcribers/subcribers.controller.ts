import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Res, Query, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Public, ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { CreateSubcriberDto, CreateSubcriberDtoByAdmin } from './dto/create-subcriber.dto';
import { IUser } from 'src/auth/user.interface';
import { UpdateSubcriberDto } from './dto/update-subcriber.dto';
import { catchError, tap } from 'rxjs';

@Controller('subcribers')
export class SubcribersController {
  constructor(
    @Inject('SUBCRIBERS_SERVICE') private client: ClientProxy,
  ) {}

  @Post()
  @ResponseMessage('User subcribe product')
  async create(@Body() createSubcriberDto: CreateSubcriberDto, @User() user : IUser) {
    const payload = {
      products: createSubcriberDto.products.toString(),
      user
    }
    return this.client.send('create_subcriber', payload).pipe(
      tap((response) => {
        if(response.error == 1) throw new BadRequestException(response.message);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      })
    );
    
    
  }

  @Post('admin')
  @Roles(['admin'])
  @ResponseMessage('Admin create subcriber for user')
  async createByAdmin(@Body() createSubcriberDtoByAdmin: CreateSubcriberDtoByAdmin, @User() admin : IUser) {
    const payload = {
      products: createSubcriberDtoByAdmin.products.toString(),
      user: {
        email: createSubcriberDtoByAdmin.email,
        name: createSubcriberDtoByAdmin.name
      },
      admin
    }
    return this.client.send('create_subcriber_byAdmin', payload).pipe(
      tap((response) => {
        if(response.error == 1) throw new BadRequestException(response.message);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      })
    );
    
  }

  @Get()
  @ResponseMessage('Fetch subcriber with pagination')
  async findAll(@Query() query: any, @Query('page') page: string, @Query('limit') limit: string) {
    const payload = {
      page: +page,
      limit: +limit,
      query
    }
    return this.client.send('findAll_subcriber', payload).pipe(
      tap((response) => {
        if(response.error == 1) throw new BadRequestException(response.message);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      })
    );
    
    
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch subcriber by id')
  async findOne(@Param('id') id: string) {
    const payload = {
      id: id
    }
    return this.client.send('findOne_subcriber', payload).pipe(
      tap((response) => {
        if(response.error == 1) throw new BadRequestException(response.message);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      })
    )
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Update subcriber by id')
  async update(@Param('id') id: string, @Body() updateSubcriberDto: UpdateSubcriberDto, @User() user : IUser) {
    const payload = {
      id: id,
      updateSubcriberDto,
      user
    }
    return this.client.send('update_subcriber', payload).pipe(
      tap((response) => {
        if(response.error == 1) throw new BadRequestException(response.message);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      })
    );
    
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Delete subcriber by id')
  async remove(@Param('id') id: string, @User() user : IUser) {
    const payload = {
      id: id,
      user
    }
    return this.client.send('delete_subcriber', payload).pipe(
      tap((response) => {
        if(response.error == 1) throw new BadRequestException(response.message);
      }),
      catchError((error) => {
        throw new BadRequestException(error.message);
      })
    );
    
  }
    
}
