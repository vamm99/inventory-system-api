import { Controller, Post, Body, Get, Query, Param, Put, Delete } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create.dto';
import { PaginationDto } from '@/utils/pagination.dto';
import { SheareDto } from './dto/sheare.dto';
import { UpdateProviderDto } from './dto/update.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  async create(@Body() data: CreateProviderDto) {
    return this.providerService.create(data);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.providerService.findAll(pagination);
  }

  @Get('products/:id')
  async findProductsByProviderId(@Param('id') id: number, @Query() pagination: PaginationDto) {
    return this.providerService.findProductsByProviderId(id, pagination);
  }
  
  @Get('share')
  async share(@Query() shareDto: SheareDto) {
    return this.providerService.share(shareDto);
  }
  
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.providerService.findOne(id);
  }


  @Put(':id')
  async update(@Param('id') id: number, @Body() data: UpdateProviderDto) {
    return this.providerService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.providerService.delete(id);
  }
}
