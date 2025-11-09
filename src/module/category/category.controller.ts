import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create.dto';
import { UpdateCategoryDto } from './dto/update.dto';
import { PaginationDto } from '@/utils/pagination.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() data: CreateCategoryDto){
    return this.categoryService.create(data);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto){
    return this.categoryService.findAll(pagination);
  }

  @Get('share')
  async findByName(@Query('name') name: string){
    return this.categoryService.findByName(name);
  }

  @Get(':id')
  async findOne(@Param('id') id: number){
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: UpdateCategoryDto){
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: number){
    return this.categoryService.delete(id);
  }
}
