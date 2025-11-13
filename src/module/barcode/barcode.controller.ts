import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BarcodeService } from './barcode.service';
import { CreateBarcodeDto } from './dto/create.dto';
import { UpdateBarcodeDto } from './dto/update.dto';
import { PaginationDto } from '@/utils/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('barcode')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) { }

  @Post()
  create(@Body() dto: CreateBarcodeDto) {
    return this.barcodeService.create(dto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.barcodeService.findAll(paginationDto);
  }

  @Get('filter')
  async findByUsageStatus(
    @Query('isUsed') isUsed: string,
    @Query() pagination: PaginationDto,
  ) {
    const isUsedBoolean = isUsed === 'true';
    return this.barcodeService.findByUsageStatus(isUsedBoolean, pagination);
  }

  @Get('share')
  findOneByBarcode(@Query('code') code: string) {
    return this.barcodeService.findOneByBarcode(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.barcodeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBarcodeDto) {
    return this.barcodeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.barcodeService.remove(id);
  }

  @Get('generate/many')
  generateMany(@Query('count') count: string) {
    const num = Number(count) || 1;
    return this.barcodeService.generateMany(num);
  }
}
