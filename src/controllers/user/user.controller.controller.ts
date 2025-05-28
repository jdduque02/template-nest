import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserControllerService } from '../../services/user/user.controller.service';
import { CreateUserControllerDto } from 'src/interfaces/create-user.controller.dto';
import { UpdateUserControllerDto } from 'src/interfaces/update-user.controller.dto';

@Controller('user.controller')
export class UserControllerController {
  constructor(private readonly userControllerService: UserControllerService) {}

  @Post()
  create(@Body() createUserControllerDto: CreateUserControllerDto) {
    return this.userControllerService.create(createUserControllerDto);
  }

  @Get()
  findAll() {
    return this.userControllerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userControllerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserControllerDto: UpdateUserControllerDto) {
    return this.userControllerService.update(+id, updateUserControllerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userControllerService.remove(+id);
  }
}
