import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { CreateProductDto } from './dtos/create.dto';
import { Product } from '../../../prisma/generated/prisma';
import { BadRequestException } from '@nestjs/common';
import { Response } from '@/utils/response';
import { UpdateProductDto } from './dtos/update.dto';
import { ShareDto } from './dtos/sheare.dto';
import { PaginationDto } from '@/utils/pagination.dto';
import { ProductKardex } from './dtos/kardex.dto';
import { Kardex } from '../../../prisma/generated/prisma';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateProductDto): Promise<Response<Product>> {
    const existProduct = await this.prisma.product.findFirst({
      where: { barcode: data.barcode },
    });

    if (existProduct) {
      throw new BadRequestException('Product already exists');
    }

    // Buscar el registro de barcode
    const barcodeRecord = await this.prisma.barcode.findUnique({
      where: { barcode: data.barcode },
    });

    // Crear el producto y actualizar el barcode en una transacción
    const createProduct = await this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.create({
        data: {
          barcode: data.barcode,
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          coste: data.coste,
          price: data.price,
          stock: data.stock,
          unit: data.unit,
          expiredAt: new Date(data.expiredAt),
          providerId: data.providerId,
        },
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, name: true } },
        },
      });

      // Si existe el registro de barcode, marcar como usado
      if (barcodeRecord) {
        await prisma.barcode.update({
          where: { barcode: data.barcode },
          data: { isUsed: true },
        });
      }

      return product;
    });

    return {
      status: 201,
      message: 'Product created successfully',
      data: createProduct,
    };
  }

  async findAll(paginationDto: PaginationDto): Promise<Response<Product[]>> {
    const { page = 1, limit = 10 } = paginationDto;
    const totalPage = await this.prisma.product.count();
    const lastPage = Math.ceil(totalPage / limit);
    const products = await this.prisma.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });
    if (!products) {
      throw new BadRequestException('Products not found');
    }
    return {
      status: 200,
      message: 'Products found successfully',
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage: lastPage,
      },
      data: products,
    };
  }

  async findOne(id: number): Promise<Response<Product>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    return {
      status: 200,
      message: 'Product found successfully',
      data: product,
    };
  }

  async getProductsByBarcode(barcode: string): Promise<Response<Product>> {
    const product = await this.prisma.product.findUnique({ where: { barcode } });
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    return {
      status: 200,
      message: 'Product found successfully',
      data: product,
    };
  }

  async share(shareDto: ShareDto): Promise<Response<Product[]>> {
    const orConditions: any[] = [];

    if (shareDto.name)
      orConditions.push({
        name: {
          contains: shareDto.name,
          mode: 'insensitive',
        },
      });

    if (shareDto.barcode)
      orConditions.push({
        barcode: {
          contains: shareDto.barcode,
          mode: 'insensitive',
        },
      });
    if (orConditions.length === 0)
      throw new BadRequestException('No data to search');

    const product = await this.prisma.product.findMany({ where: { OR: orConditions } });
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    return {
      status: 200,
      message: 'Product found successfully',
      data: product,
    };
  }

  async update(id: number, data: UpdateProductDto): Promise<Response<Product>> {
    const updateProduct = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });
    if (!updateProduct) {
      throw new BadRequestException('Product not updated');
    }
    return {
      status: 200,
      message: 'Product updated successfully',
      data: updateProduct,
    };
  }

  async delete(id: number): Promise<Response<Product>> {
    const deleteProduct = await this.prisma.product.delete({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });

    return {
      status: 200,
      message: 'Product deleted successfully',
      data: deleteProduct,
    };
  }

  async kardex(products: ProductKardex[]) {
    // Validamos que el producto exista y tenga stock mayor a cero
    for (const product of products) {
      const productFound = await this.prisma.product.findUnique({ where: { id: product.id } });
      if (!productFound) {
        throw new BadRequestException(`Product ${product.name} not found`);
      }
      if (productFound.stock < product.quantity) {
        throw new BadRequestException(`Product ${product.name} stock is not enough`);
      }

      // Actualizamos el stock
      const updateProduct = await this.prisma.product.update({
        where: { id: product.id },
        data: { stock: productFound.stock - product.quantity },
      });

      // Creamos el movimiento en Kardex a cada producto
      await this.prisma.kardex.create({
        data: {
          productId: product.id,
          quantity: product.quantity,
          comment: 'Producto descargado',
          stock: updateProduct.stock,
        },
      });
    }
    return {
      status: 200,
      message: 'Kardex created successfully',
    };
  }

  async getAllKardex(paginationDto: PaginationDto): Promise<Response<Kardex[]>> {
    const { page = 1, limit = 10 } = paginationDto;
    const totalPage = await this.prisma.kardex.count();
    const lastPage = Math.ceil(totalPage / limit);
    const kardex = await this.prisma.kardex.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        product: { select: { id: true, name: true } },
      },
    });
    if (!kardex) {
      throw new BadRequestException('Kardex not found');
    }
    return {
      status: 200,
      message: 'Kardex found successfully',
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage: lastPage,
      },
      data: kardex,
    };
  }

  async getAllKardexByProduct(id: number, paginationDto: PaginationDto): Promise<Response<Kardex[]>> {
    const { page = 1, limit = 10 } = paginationDto;
    const totalPage = await this.prisma.kardex.count({ where: { productId: id } });
    const lastPage = Math.ceil(totalPage / limit);
    const kardex = await this.prisma.kardex.findMany({
      where: { productId: id },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        product: { select: { id: true, name: true } },
      },
    });
    if (!kardex) {
      throw new BadRequestException('Kardex not found');
    }
    return {
      status: 200,
      message: 'Kardex found successfully',
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage: lastPage,
      },
      data: kardex,
    };
  }
}
