import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { barcode } from '../../../prisma/generated/prisma';
import { CreateBarcodeDto } from './dto/create.dto';
import { UpdateBarcodeDto } from './dto/update.dto';
import { Response } from '@/utils/response';
import { PaginationDto } from '@/utils/pagination.dto';
import { PrismaService } from '@/core/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BarcodeService {
  private browser: puppeteer.Browser;

  constructor(private readonly prisma: PrismaService) {}

  // 🔹 Inicializar browser de Puppeteer
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });
    }
    return this.browser;
  }

  // 🔹 Cerrar browser al destruir el servicio
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // 🔹 Función interna: genera un EAN-13 válido
  private generateEAN13(base12: string): string {
    if (!/^\d{12}$/.test(base12)) throw new Error('Debe tener 12 dígitos');
    const digits = base12.split('').map(Number);
    const sum = digits.reduce(
      (acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3),
      0,
    );
    const checkDigit = (10 - (sum % 10)) % 10;
    return base12 + checkDigit;
  }

  // 🔹 NUEVA FUNCIÓN: Generar PDF con códigos de barras
  async generatePDF(isUsed?: boolean): Promise<Buffer> {
    // Construir filtro
    const where = isUsed !== undefined ? { isUsed } : {};

    // Obtener códigos de barras
    const barcodes = await this.prisma.barcode.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    if (barcodes.length === 0) {
      throw new NotFoundException(
        'No hay códigos de barras para generar el PDF',
      );
    }

    // Obtener productos asociados si están usados
    const barcodesWithProducts = await Promise.all(
      barcodes.map(async (barcode) => {
        let product: any = null;

        if (barcode.isUsed) {
          product = await this.prisma.product.findFirst({
            where: { barcode: barcode.barcode },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              category: { select: { name: true } },
              provider: { select: { name: true } },
            },
          });
        }

        return { ...barcode, product };
      }),
    );

    // Generar HTML
    const html = this.generateBarcodeHTML(barcodesWithProducts, isUsed);

    // Crear PDF con Puppeteer
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm',
        },
      });

      return pdf as Buffer;
    } finally {
      await page.close();
    }
  }

  // 🔹 Generar HTML para el PDF
  private generateBarcodeHTML(barcodes: any[], isUsed?: boolean): string {
    const title =
      isUsed === true
        ? 'Códigos de Barras - USADOS'
        : isUsed === false
          ? 'Códigos de Barras - DISPONIBLES'
          : 'Códigos de Barras - TODOS';

    const rows = barcodes
      .map((item, index) => {
        const productInfo = item.product
          ? `
          <div class="product-info">
            <strong>Producto:</strong> ${item.product.name}<br>
            <strong>Categoría:</strong> ${item.product.category?.name || 'N/A'}<br>
            <strong>Proveedor:</strong> ${item.product.provider?.name || 'N/A'}<br>
            <strong>Precio:</strong> $${item.product.price?.toFixed(2) || '0.00'}<br>
            <strong>Stock:</strong> ${item.product.stock || 0}
          </div>
        `
          : '<div class="product-info">Sin producto asociado</div>';

        return `
        <div class="barcode-item">
          <div class="barcode-header">
            <span class="barcode-number">#${index + 1}</span>
            <span class="barcode-status ${item.isUsed ? 'used' : 'available'}">
              ${item.isUsed ? '● USADO' : '○ DISPONIBLE'}
            </span>
          </div>
          <div class="barcode-code">${item.barcode}</div>
          <div class="barcode-image">
            <img src="${item.imageUrl}" alt="Código de barras ${item.barcode}">
          </div>
          ${productInfo}
          <div class="barcode-date">
            Creado: ${new Date(item.createdAt).toLocaleDateString('es-ES')}
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }

          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }

          .header p {
            font-size: 14px;
            opacity: 0.9;
          }

          .stats {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }

          .stat-card {
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }

          .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
          }

          .stat-card .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }

          .barcode-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .barcode-item {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-inside: avoid;
          }

          .barcode-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .barcode-number {
            font-weight: bold;
            color: #333;
            font-size: 14px;
          }

          .barcode-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
          }

          .barcode-status.used {
            background: #fee;
            color: #c33;
          }

          .barcode-status.available {
            background: #efe;
            color: #3c3;
          }

          .barcode-code {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }

          .barcode-image {
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            background: #fafafa;
            border-radius: 5px;
          }

          .barcode-image img {
            max-width: 100%;
            height: auto;
          }

          .product-info {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 5px;
            font-size: 12px;
            line-height: 1.6;
            color: #555;
            margin-top: 10px;
          }

          .barcode-date {
            text-align: right;
            font-size: 10px;
            color: #999;
            margin-top: 10px;
          }

          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 12px;
          }

          @media print {
            body {
              background: white;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generado el ${new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="number">${barcodes.length}</div>
            <div class="label">Total Códigos</div>
          </div>
          <div class="stat-card">
            <div class="number">${barcodes.filter((b) => b.isUsed).length}</div>
            <div class="label">Usados</div>
          </div>
          <div class="stat-card">
            <div class="number">${barcodes.filter((b) => !b.isUsed).length}</div>
            <div class="label">Disponibles</div>
          </div>
        </div>

        <div class="barcode-grid">
          ${rows}
        </div>

        <div class="footer">
          <p>Documento generado automáticamente por el Sistema</p>
        </div>
      </body>
      </html>
    `;
  }

  // ========== FUNCIONES EXISTENTES ==========

  async generateMany(count: number): Promise<Response<barcode[]>> {
    const codes: barcode[] = [];
    const prefix = '770000';

    const last = await this.prisma.barcode.findFirst({
      orderBy: { id: 'desc' },
    });

    let start = 0;
    if (last) {
      const lastNumeric = parseInt(last.barcode.slice(prefix.length, 12));
      start = isNaN(lastNumeric) ? 0 : lastNumeric + 1;
    }

    for (let i = start; i < start + count; i++) {
      const base12 = (prefix + i.toString().padStart(6, '0')).slice(0, 12);
      const ean13 = this.generateEAN13(base12);

      const exists = await this.prisma.barcode.findUnique({
        where: { barcode: ean13 },
      });

      if (!exists) {
        const imageUrl = `https://barcode.tec-it.com/barcode.ashx?data=${ean13}&code=EAN13`;
        const newBarcode = await this.prisma.barcode.create({
          data: { barcode: ean13, imageUrl },
        });
        codes.push(newBarcode);
      }
    }

    return {
      status: 201,
      message: `Códigos generados exitosamente (${codes.length} nuevos)`,
      data: codes,
    };
  }

  async create(dto: CreateBarcodeDto): Promise<Response<barcode>> {
    const exists = await this.prisma.barcode.findUnique({
      where: { barcode: dto.barcode },
    });
    if (exists) throw new BadRequestException('El código ya existe');

    const imageUrl =
      dto.imageUrl ||
      `https://barcode.tec-it.com/barcode.ashx?data=${dto.barcode}&code=EAN13`;

    const barcode = await this.prisma.barcode.create({
      data: { barcode: dto.barcode, imageUrl },
    });

    return {
      status: 201,
      message: 'Código creado exitosamente',
      data: barcode,
    };
  }

  async findAll(pagination: PaginationDto): Promise<Response<any[]>> {
    const { page = 1, limit = 10 } = pagination;
    const totalPage = await this.prisma.barcode.count();
    const lastPage = Math.ceil(totalPage / limit);

    const barcodes = await this.prisma.barcode.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { id: 'desc' },
    });

    const barcodesWithProducts = await Promise.all(
      barcodes.map(async (barcode) => {
        let product: any = null;

        if (barcode.isUsed) {
          product = await this.prisma.product.findFirst({
            where: { barcode: barcode.barcode },
            select: {
              id: true,
              name: true,
              barcode: true,
              price: true,
              stock: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              provider: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
        }

        return {
          ...barcode,
          product,
        };
      }),
    );

    return {
      status: 200,
      message: 'Códigos obtenidos exitosamente',
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage,
      },
      data: barcodesWithProducts,
    };
  }

  async findOneByBarcode(code: string): Promise<Response<any>> {
    const barcode = await this.prisma.barcode.findUnique({
      where: { barcode: code },
    });

    if (!barcode) throw new NotFoundException('Código no encontrado');

    let product: any = null;

    if (barcode.isUsed) {
      product = await this.prisma.product.findFirst({
        where: { barcode: code },
        select: {
          id: true,
          name: true,
          barcode: true,
          description: true,
          price: true,
          coste: true,
          stock: true,
          unit: true,
          expiredAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    return {
      status: 200,
      message: 'Código obtenido exitosamente',
      data: {
        ...barcode,
        product,
      },
    };
  }

  async findByUsageStatus(
    isUsed: boolean,
    pagination: PaginationDto,
  ): Promise<Response<any[]>> {
    const { page = 1, limit = 10 } = pagination;

    const where = { isUsed };

    const totalPage = await this.prisma.barcode.count({ where });
    const lastPage = Math.ceil(totalPage / limit);

    const barcodes = await this.prisma.barcode.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { id: 'desc' },
    });

    let barcodesWithProducts = barcodes;

    if (isUsed) {
      barcodesWithProducts = await Promise.all(
        barcodes.map(async (barcode) => {
          const product = await this.prisma.product.findFirst({
            where: { barcode: barcode.barcode },
            select: {
              id: true,
              name: true,
              barcode: true,
              price: true,
              stock: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              provider: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          return {
            ...barcode,
            product,
          };
        }),
      );
    } else {
      barcodesWithProducts = barcodes.map((barcode) => ({
        ...barcode,
        product: null,
      }));
    }

    return {
      status: 200,
      message: `Códigos ${isUsed ? 'usados' : 'disponibles'} obtenidos exitosamente`,
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage,
      },
      data: barcodesWithProducts,
    };
  }

  async findOne(id: number): Promise<Response<barcode>> {
    const barcode = await this.prisma.barcode.findUnique({ where: { id } });
    if (!barcode) throw new NotFoundException('Código no encontrado');
    return {
      status: 200,
      message: 'Código obtenido exitosamente',
      data: barcode,
    };
  }

  async update(id: number, dto: UpdateBarcodeDto): Promise<Response<barcode>> {
    await this.findOne(id);
    const barcode = await this.prisma.barcode.update({
      where: { id },
      data: dto,
    });
    return {
      status: 200,
      message: 'Código actualizado exitosamente',
      data: barcode,
    };
  }

  async remove(id: number): Promise<Response<barcode>> {
    await this.findOne(id);
    const barcode = await this.prisma.barcode.delete({ where: { id } });
    return {
      status: 200,
      message: 'Código eliminado exitosamente',
      data: barcode,
    };
  }
}
