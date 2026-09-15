import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  isProcurador?: boolean;
  isAnunciante?: boolean;
  termsAcceptedAt?: Date;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly publicSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    isProcurador: true,
    isAnunciante: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
  };

  async findByEmail(email: string) {
    // Usado só pelo auth (login) — aqui PRECISAMOS da password para comparar
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicSelect,
    });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }
    return user;
  }

  async create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: { name?: string }) {
    await this.findById(id); // garante que existe, senão lança 404
    return this.prisma.user.update({
      where: { id },
      data,
      select: this.publicSelect,
    });
  }
}