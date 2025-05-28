import { Injectable } from '@nestjs/common';
import { CreateUserControllerDto } from 'src/interfaces/create-user.controller.dto';
import { UpdateUserControllerDto } from 'src/interfaces/update-user.controller.dto';

@Injectable()
export class UserControllerService {
  create(createUserControllerDto: CreateUserControllerDto) {
    return 'This action adds a new userController';
  }

  findAll() {
    return `This action returns all userController`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userController`;
  }

  update(id: number, updateUserControllerDto: UpdateUserControllerDto) {
    return `This action updates a #${id} userController`;
  }

  remove(id: number) {
    return `This action removes a #${id} userController`;
  }
}
