import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { Response } from '@/utils/response';
import { PaginationDto } from '@/utils/pagination.dto';
import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async inventoryOfProducts(pagination: PaginationDto): Promise<Response<any>> {
    const { page = 1, limit = 10 } = pagination;
    const totalPage = await this.prisma.product.count();
    const lastPage = Math.ceil(totalPage / limit);
    const inventory = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        barcode: true,
        stock: true,
        unit: true,
        coste: true,
        price: true,
        category: { select: { name: true } },
        provider: { select: { name: true } },
      },
      take: limit,
      skip: (page - 1) * limit,
    });
    if (!inventory) {
      throw new BadRequestException('No inventory found');
    }
    const inventoryWithTotalCost = inventory.map((item) => ({
      ...item,
      totalCost: item.coste * item.stock,
      totalPrice: item.price * item.stock,
    }));
    const totalCostOfInventory = inventory.reduce(
      (acc, item) => acc + item.coste * item.stock,
      0,
    );
    const totalPriceOfInventory = inventory.reduce(
      (acc, item) => acc + item.price * item.stock,
      0,
    );

    return {
      status: 200,
      message: 'Inventory found successfully',
      data: inventoryWithTotalCost,
      totalCostOfInventory,
      totalPriceOfInventory,
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage,
      },
    };
  }

  async inventoryOfDishe(pagination: PaginationDto): Promise<Response<any>> {
    const { page = 1, limit = 10 } = pagination;
    const totalPage = await this.prisma.dishes.count();
    const lastPage = Math.ceil(totalPage / limit);
    const inventory = await this.prisma.dishes.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        coste: true,
        price: true,
      },
      take: limit,
      skip: (page - 1) * limit,
    });
    if (!inventory) {
      throw new BadRequestException('No inventory found');
    }
    const inventoryWithTotalCost = inventory.map((item) => ({
      ...item,
      totalCost: item.coste * item.stock,
      totalPrice: item.price * item.stock,
    }));
    const totalCostOfInventory = inventory.reduce(
      (acc, item) => acc + item.coste * item.stock,
      0,
    );
    const totalPriceOfInventory = inventory.reduce(
      (acc, item) => acc + item.price * item.stock,
      0,
    );

    return {
      status: 200,
      message: 'Inventory found successfully',
      data: inventoryWithTotalCost,
      totalCostOfInventory,
      totalPriceOfInventory,
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage,
      },
    };
  }

  //
  // EXCEL REPORTS
  //
  async generateExcelReportForProducts() {
    const inventory = await this.prisma.product.findMany({
      select: {
        name: true,
        barcode: true,
        stock: true,
        unit: true,
        coste: true,
        price: true,
        category: { select: { name: true } },
        provider: { select: { name: true, phone: true, address: true } },
      },
    });

    // Crear workbook y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Definir columnas
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 32 },
      { header: 'Barcode', key: 'barcode', width: 25 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Unit', key: 'unit', width: 25 },
      { header: 'Cost', key: 'coste', width: 10 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Provider', key: 'provider', width: 25 },
      { header: 'Phone provider', key: 'phone', width: 25 },
      { header: 'Address provider', key: 'address', width: 25 },
    ];
    inventory.forEach((item) => {
      worksheet.addRow({
        name: item.name,
        barcode: item.barcode,
        stock: item.stock,
        unit: item.unit,
        coste: item.coste,
        price: item.price,
        category: item.category.name,
        provider: item.provider.name,
        phone: item.provider.phone,
        address: item.provider.address,
      });
    });

    // Estilo de encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async generateExcelReportForDishe(){
     const inventory = await this.prisma.dishes.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        coste: true,
        price: true,
      },
    });

    // Crear workbook y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Definir columnas
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 32 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Cost', key: 'coste', width: 10 },
      { header: 'Price', key: 'price', width: 10 },
    ];
    inventory.forEach((item) => {
      worksheet.addRow({
        name: item.name,
        stock: item.stock,
        coste: item.coste,
        price: item.price,
      });
    });

    // Estilo de encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
