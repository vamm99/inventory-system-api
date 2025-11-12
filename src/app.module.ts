import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { ProductModule } from './module/product/product.module';
import { ProviderModule } from './module/provider/provider.module';
import { DisheModule } from './module/dishe/dishe.module';
import { CategoryModule } from './module/category/category.module';
import { InventoryModule } from './module/inventory/inventory.module';
import { BarcodeModule } from './module/barcode/barcode.module';
import { AuthModule } from './module/auth/auth.module';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './module/auth/core/jwt-auth.guard';
import { RolesGuard } from './module/auth/core/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal:true
    }),
    ProductModule,
    ProviderModule,
    DisheModule,
    CategoryModule,
    InventoryModule,
    BarcodeModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {provide: APP_GUARD, useClass: JwtAuthGuard},
    {provide: APP_GUARD, useClass: RolesGuard}
  ],
})
export class AppModule {}
