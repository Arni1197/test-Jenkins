// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // чтобы PrismaService был доступен во всех модулях без лишних импортов
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}