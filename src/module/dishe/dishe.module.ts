import { Module } from '@nestjs/common';
import { DisheService } from './dishe.service';
import { DisheController } from './dishe.controller';

@Module({
  controllers: [DisheController],
  providers: [DisheService],
})
export class DisheModule {}
