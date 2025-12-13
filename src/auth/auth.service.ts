import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user-dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createUser(data: CreateUserDto) {
    // check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    // hash password with Argon2
    const password = await argon2.hash(data.password);

    // create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password, // store hashed password
      },
    });

    return {
      statusCode: 201,
      message: 'User Created Successfully',
      data: await this.sanitizeUser(user),
    };
  }

  // Login Service
  async login(email: string, plainPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email or Password Incorrect');
    }

    const passwordValid = await argon2.verify(user.password, plainPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Email or Password Incorrect');
    }

    // Generate JWT
    console.log('user', user);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    console.log('JWT payload', payload);
    // Return user (sanitized) and token
    const { password, ...rest } = user;
    return {
      statusCode: 200,
      message: 'Login successful',
      data: {
        user: rest,
        token,
      },
    };
  }

  // Clean up the User data to remove password
  async sanitizeUser(user: any) {
    const { password, ...rest } = user;
    console.log('rest:', rest);
    return rest;
  }
}
