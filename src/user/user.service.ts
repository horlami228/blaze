import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Clean up the User data to remove password
  async sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    console.log('rest:', rest);
    return rest;
  }
}
