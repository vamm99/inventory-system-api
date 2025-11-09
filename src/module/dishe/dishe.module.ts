import { Module } from '@nestjs/common';
import { DisheService } from './dishe.service';
import { DisheController } from './dishe.controller';
import { PrismaService } from '@/core/prisma.service';

@Module({
  controllers: [DisheController],
  providers: [DisheService, PrismaService],
})
export class DisheModule {}
