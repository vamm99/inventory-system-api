import { Controller, Get, Query, Res } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PaginationDto } from '@/utils/pagination.dto';
import express from 'express';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async inventoryOfProducts(@Query() pagination: PaginationDto) {
    return this.inventoryService.inventoryOfProducts(pagination);
  }

  @Get('excel')
  async generateExcelReportForProducts(@Res() res: express.Response) {
    const buffer = await this.inventoryService.generateExcelReportForProducts();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte_inventario_productos.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.send(buffer);
  }

  @Get('dishe')
  async inventoryOfDishe(@Query() pagination: PaginationDto) {
    return this.inventoryService.inventoryOfDishe(pagination);
  }

  @Get('dishe/excel')
  async generateExcelReportForDishe(@Res() res: express.Response) {
    const buffer = await this.inventoryService.generateExcelReportForDishe();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte_inventario_platos.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.send(buffer);
  }
}
