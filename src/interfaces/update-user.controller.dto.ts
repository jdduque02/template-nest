import { PartialType } from '@nestjs/swagger';
import { CreateUserControllerDto } from './create-user.controller.dto';

export class UpdateUserControllerDto extends PartialType(CreateUserControllerDto) {}
