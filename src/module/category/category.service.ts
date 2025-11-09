import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { CreateCategoryDto } from './dto/create.dto';
import { UpdateCategoryDto } from './dto/update.dto';
import { Response } from '@/utils/response';
import { Category } from '../../../prisma/generated/prisma';
import { PaginationDto } from '@/utils/pagination.dto';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateCategoryDto): Promise<Response<Category>> {
        const createCategory = await this.prisma.category.create({ 
            data: {
                name: data.name
            }
        });
        if (!createCategory) {
            throw new BadRequestException('Category not created');
        }
        return {
            status: 201,
            message: 'Category created successfully',
            data: createCategory
        };
    }

    async findAll(pagination: PaginationDto): Promise<Response<Category[]>> {
        const { limit = 10, page = 1 } = pagination;
        const totalPage = await this.prisma.category.count();
        const lasPage = Math.ceil(totalPage / limit);
        const categories = await this.prisma.category.findMany({
            take: limit,
            skip: (page - 1) * limit
        });
        if (!categories) {
            throw new BadRequestException('Categories not found');
        }
        return {
            status: 200,
            message: 'Categories found successfully',
            pagination: {
                limit,
                page,
                total: totalPage,
                lastPage: lasPage
            },
            data: categories
        };
    }

    async findOne(id: number): Promise<Response<Category>> {
        const category = await this.prisma.category.findUnique({
            where: {
                id
            }
        });
        if (!category) {
            throw new BadRequestException('Category not found');
        }
        return {
            status: 200,
            message: 'Category found successfully',
            data: category
        };
    }

    async update(id: number, data: UpdateCategoryDto): Promise<Response<Category>> {
        const updateCategory = await this.prisma.category.update({
            where: {
                id
            },
            data: {
                name: data.name
            }
        });
        if (!updateCategory) {
            throw new BadRequestException('Category not updated');
        }
        return {
            status: 200,
            message: 'Category updated successfully',
            data: updateCategory
        };
    }

    async delete(id: number): Promise<Response<Category>> {
        const deleteCategory = await this.prisma.category.delete({
            where: {
                id
            }
        });
        if (!deleteCategory) {
            throw new BadRequestException('Category not deleted');
        }
        return {
            status: 200,
            message: 'Category deleted successfully',
            data: deleteCategory
        };
    }

}
