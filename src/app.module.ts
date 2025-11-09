import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { ProductModule } from './module/product/product.module';
import { ProviderModule } from './module/provider/provider.module';
import { DisheModule } from './module/dishe/dishe.module';
import { CategoryModule } from './module/category/category.module';

@Module({
  imports: [ProductModule, ProviderModule, DisheModule, CategoryModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
