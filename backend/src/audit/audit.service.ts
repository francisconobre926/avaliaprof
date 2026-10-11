import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: Prisma.InputJsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: { adminId, action, targetType, targetId, details },
    });
  }
}