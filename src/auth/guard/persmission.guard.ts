import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminPermission } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<AdminPermission[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    // Get admin with permissions
    const admin = await this.prisma.administrator.findUnique({
      where: { userId },
      select: {
        permissions: true,
        isSuperAdmin: true,
        status: true,
      },
    });

    if (!admin) {
      throw new ForbiddenException('Admin profile not found');
    }

    if (admin.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account is not active');
    }

    // Super admin has all permissions
    if (admin.isSuperAdmin) {
      return true;
    }

    // Check if admin has required permissions
    const hasPermission = requiredPermissions.every((permission) =>
      admin.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
