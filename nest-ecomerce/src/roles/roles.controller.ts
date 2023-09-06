import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Res, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResponseMessage, Roles, User } from 'src/decorator/customzie.decorator';
import { IUser } from 'src/auth/user.interface';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(['admin'])
  @ResponseMessage('Create a role')
  create(@Body() createRoleDto: CreateRoleDto, @User() user : IUser) {
    return this.rolesService.create(createRoleDto,user);
  }

  @Get()
  @ResponseMessage('Fetch role with pagination')
  findAll(@Query() query: any, @Query('page') page: string, @Query('limit') limit: string) {
    
    return this.rolesService.findAll(+page, +limit, query);
  }

  @Get(':id')
  @ResponseMessage('Fetch role by id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Update role by id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @User() user : IUser) {
    return this.rolesService.update(id, updateRoleDto,user);
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Delete role by id')
  remove(@Param('id') id: string, @User() user : IUser) {
    return this.rolesService.remove(id,user);
  }
}
