import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
