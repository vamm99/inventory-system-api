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

@Injectable()
export class BarcodeService {
  constructor(private readonly prisma: PrismaService) {}

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

  // 🔹 Generar varios códigos EAN-13
  async generateMany(count: number): Promise<Response<barcode[]>> {
    const codes: barcode[] = [];
    const prefix = '770000';

    // Busca el último código generado
    const last = await this.prisma.barcode.findFirst({
      orderBy: { id: 'desc' },
    });

    // Calcula el número inicial
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

  // 🔹 Crear un código manualmente
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

  // 🔹 Obtener todos
  async findAll(pagination: PaginationDto): Promise<Response<barcode[]>> {
    const { page = 1, limit = 10 } = pagination;
    const totalPage = await this.prisma.barcode.count();
    const lastPage = Math.ceil(totalPage / limit);
    const barcodes = await this.prisma.barcode.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { id: 'desc' },
    });
    return {
      status: 200,
      message: 'Códigos obtenidos exitosamente',
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage: lastPage,
      },
      data: barcodes,
    };
  }

  // 🔹 Obtener uno por ID
  async findOne(id: number): Promise<Response<barcode>> {
    const barcode = await this.prisma.barcode.findUnique({ where: { id } });
    if (!barcode) throw new NotFoundException('Código no encontrado');
    return {
      status: 200,
      message: 'Código obtenido exitosamente',
      data: barcode,
    };
  }

  // 🔹 Actualizar
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

  // 🔹 Eliminar
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
