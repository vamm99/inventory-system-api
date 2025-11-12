import { PrismaService } from '@/core/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateDisheDto } from './dto/create.dto';
import { UpdateDisheDto } from './dto/update.dto';
import { Response } from '@/utils/response';
import { Dishes, Prisma } from '../../../prisma/generated/prisma/client';
import { PaginationDto } from '@/utils/pagination.dto';
import { BadRequestException } from '@nestjs/common';
import { ShareDto } from './dto/sheare.dto';

@Injectable()
export class DisheService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDisheDto): Promise<Response<Dishes>> {
    const createDishe = await this.prisma.dishes.create({
      data,
    });
    return {
      status: 201,
      message: 'Dishe created successfully',
      data: createDishe,
    };
  }

  async findAll(paginationDto: PaginationDto): Promise<Response<Dishes[]>> {
    const { page = 1, limit = 10 } = paginationDto;
    const totalPage = await this.prisma.dishes.count();
    const lastPage = Math.ceil(totalPage / limit);
    const dishes = await this.prisma.dishes.findMany({
      take: limit,
      skip: (page - 1) * limit,
    });
    if (!dishes) {
      throw new BadRequestException('Dishes not found');
    }
    return {
      status: 200,
      message: 'Dishes found successfully',
      pagination: {
        limit,
        page,
        total: totalPage,
        lastPage: lastPage,
      },
      data: dishes,
    };
  }

  async findOne(id: number): Promise<Response<Dishes>> {
    const dish = await this.prisma.dishes.findUnique({ where: { id } });
    if (!dish) {
      throw new BadRequestException('Dish not found');
    }
    return {
      status: 200,
      message: 'Dish found successfully',
      data: dish,
    };
  }

  async share(shareDto: ShareDto): Promise<Response<Dishes[]>> {
    let filter: ShareDto = {};

    if (shareDto.name)
      filter.name = {
        contains: shareDto.name,
        mode: 'insensitive',
      };

    if (Object.keys(filter).length === 0)
      throw new BadRequestException('No data to search');

    const dishes = await this.prisma.dishes.findMany({
      where: filter,
    });
    if (!dishes) {
      throw new BadRequestException('Dishes not found');
    }
    return {
      status: 200,
      message: 'Dishes found successfully',
      data: dishes,
    };
  }

  async update(id: number, data: UpdateDisheDto): Promise<Response<Dishes>> {
    const existDish = await this.prisma.dishes.findUnique({ where: { id } });
    if (!existDish) {
      throw new BadRequestException('Dish not found');
    }

    // Asegurar que content sea un objeto válido o JsonNull
    const mergedContent = data.content
      ? {
          ...(existDish.content as Record<string, any>),
          ...(data.content as Record<string, any>),
        }
      : (existDish.content ?? Prisma.JsonNull);

    const updateDish = await this.prisma.dishes.update({
      where: { id },
      data: {
        ...data,
        content: mergedContent as Prisma.InputJsonValue,
      },
    });

    return {
      status: 200,
      message: 'Dish updated successfully',
      data: updateDish,
    };
  }

  async remove(id: number): Promise<Response<Dishes>> {
    const deleteDish = await this.prisma.dishes.delete({ where: { id } });
    if (!deleteDish) {
      throw new BadRequestException('Dish not deleted');
    }
    return {
      status: 200,
      message: 'Dish deleted successfully',
      data: deleteDish,
    };
  }
}
