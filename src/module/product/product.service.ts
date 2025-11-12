import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { CreateProductDto } from './dtos/create.dto';
import { Product } from '../../../prisma/generated/prisma';
import { BadRequestException } from '@nestjs/common';
import { Response } from '@/utils/response';
import { UpdateProductDto } from './dtos/update.dto';
import { ShareDto } from './dtos/sheare.dto';
import { PaginationDto } from '@/utils/pagination.dto';
import { filter } from 'rxjs';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductDto): Promise<Response<Product>> {
    const existProduct = await this.prisma.product.findFirst({
      where: { barcode: data.barcode },
    });
    if (existProduct) {
      throw new BadRequestException('Product already exists');
    }
    const createProduct = await this.prisma.product.create({
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
}
