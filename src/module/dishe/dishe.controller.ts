import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { DisheService } from './dishe.service';
import { CreateDisheDto } from './dto/create.dto';
import { UpdateDisheDto } from './dto/update.dto';
import { PaginationDto } from '@/utils/pagination.dto';
import { ShareDto } from './dto/sheare.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('dishe')
export class DisheController {
  constructor(private readonly disheService: DisheService) {}

  @Post()
  async create(@Body() data: CreateDisheDto) {
    return this.disheService.create(data);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.disheService.findAll(paginationDto);
  }

  @Get('share')
  async share(@Query() shareDto: ShareDto) {
    return this.disheService.share(shareDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.disheService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: UpdateDisheDto) {
    return this.disheService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.disheService.remove(id);
  }
}
