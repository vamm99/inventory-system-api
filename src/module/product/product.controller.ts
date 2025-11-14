import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dtos/create.dto';
import { ShareDto } from './dtos/sheare.dto';
import { UpdateProductDto } from './dtos/update.dto';
import { PaginationDto } from '@/utils/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductKardex } from './dtos/kardex.dto';

@Roles('ADMIN')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() data: CreateProductDto){
    return this.productService.create(data);
  }

  @Post('kardex')
  async kardex(@Body() products: ProductKardex[]){
    return this.productService.kardex(products);
  }

  @Get('kardex')
  async getAllKardex(@Query() paginationDto: PaginationDto){
    return this.productService.getAllKardex(paginationDto);
  }

  @Get('kardex/:id')
  async getAllKardexByProduct(@Param('id') id: number, @Query() paginationDto: PaginationDto){
    return this.productService.getAllKardexByProduct(id, paginationDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto){
    return this.productService.findAll(paginationDto);
  }

  @Get('barcode/:barcode')
  async getProductsByBarcode(@Param('barcode') barcode: string){
    return this.productService.getProductsByBarcode(barcode);
  }
  
  @Get('share')
  async share(@Query() shareDto: ShareDto){
    return this.productService.share(shareDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: number){
    return this.productService.findOne(id);
  }


  @Put(':id')
  async update(@Param('id') id: number, @Body() data: UpdateProductDto){
    return this.productService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: number){
    return this.productService.delete(id);
  }
}
