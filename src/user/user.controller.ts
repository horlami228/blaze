import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('api/v1/user/')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
