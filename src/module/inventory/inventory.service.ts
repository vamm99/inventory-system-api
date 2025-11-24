import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { Response } from '@/utils/response';
import { PaginationDto } from '@/utils/pagination.dto';
import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { IsDateString, IsOptional } from 'class-validator';

export class KardexFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

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

  async generateExcelReportForDishe() {
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

  async generateExcelReportForProductSalesOfTheDay(filters?: KardexFilterDto) {
    // Si no se proporcionan fechas, usar el día actual
    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().setHours(0, 0, 0, 0));

    const endDate = filters?.endDate
      ? new Date(filters.endDate)
      : new Date(new Date().setHours(23, 59, 59, 999));

    // Obtener movimientos del Kardex filtrados por fecha
    const kardexMovements = await this.prisma.kardex.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        quantity: true,
        stock: true,
        comment: true,
        createdAt: true,
        product: {
          select: {
            name: true,
            barcode: true,
            unit: true,
            coste: true,
            price: true,
            category: { select: { name: true } },
            provider: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Crear workbook y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kardex Movements');

    // Definir columnas
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Product', key: 'product', width: 32 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Provider', key: 'provider', width: 25 },
      { header: 'Movement', key: 'movement', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Stock After', key: 'stock', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Cost', key: 'cost', width: 12 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Total Cost', key: 'totalCost', width: 15 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Comment', key: 'comment', width: 40 },
    ];

    // Agregar filas de datos
    kardexMovements.forEach((item) => {
      const movementType = item.quantity > 0 ? 'Entry' : 'Exit';
      const absQuantity = Math.abs(item.quantity);

      worksheet.addRow({
        date: item.createdAt.toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        product: item.product.name,
        barcode: item.product.barcode,
        category: item.product.category.name,
        provider: item.product.provider.name,
        movement: movementType,
        quantity: absQuantity,
        stock: item.stock,
        unit: item.product.unit,
        cost: item.product.coste,
        price: item.product.price,
        totalCost: (absQuantity * item.product.coste).toFixed(2),
        totalPrice: (absQuantity * item.product.price).toFixed(2),
        comment: item.comment,
      });
    });

    // Estilo de encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Aplicar bordes a todas las celdas con datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }
    });

    // Agregar resumen al final
    const lastRow = worksheet.rowCount + 2;
    worksheet.mergeCells(`A${lastRow}:F${lastRow}`);
    worksheet.getCell(`A${lastRow}`).value = 'SUMMARY';
    worksheet.getCell(`A${lastRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${lastRow}`).alignment = { horizontal: 'center' };

    // Calcular totales
    const totalEntries = kardexMovements.filter((k) => k.quantity > 0).length;
    const totalExits = kardexMovements.filter((k) => k.quantity < 0).length;
    const totalCost = kardexMovements.reduce(
      (acc, item) => acc + Math.abs(item.quantity) * item.product.coste,
      0,
    );
    const totalPrice = kardexMovements.reduce(
      (acc, item) => acc + Math.abs(item.quantity) * item.product.price,
      0,
    );

    worksheet.getCell(`A${lastRow + 1}`).value =
      `Total Entries: ${totalEntries}`;
    worksheet.getCell(`A${lastRow + 2}`).value = `Total Exits: ${totalExits}`;
    worksheet.getCell(`A${lastRow + 3}`).value =
      `Total Movements: ${kardexMovements.length}`;
    worksheet.getCell(`D${lastRow + 1}`).value =
      `Total Cost: $${totalCost.toFixed(2)}`;
    worksheet.getCell(`D${lastRow + 2}`).value =
      `Total Price: $${totalPrice.toFixed(2)}`;

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
