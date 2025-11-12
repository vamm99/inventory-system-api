import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { CreateProviderDto } from './dto/create.dto';
import { Product, Provider } from '../../../prisma/generated/prisma';
import { Response } from '@/utils/response';
import { BadRequestException } from '@nestjs/common';
import { PaginationDto } from '@/utils/pagination.dto';
import { UpdateProviderDto } from './dto/update.dto';
import { SheareDto } from './dto/sheare.dto';

@Injectable()
export class ProviderService {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateProviderDto): Promise<Response<Provider>> {
        const createProvider = await this.prisma.provider.create({ 
            data: {
                name: data.name,
                email: data.email!,
                phone: data.phone!,
                address: data.address!
            }
        });
        if (!createProvider) {
            throw new BadRequestException('Provider not created');
        }
        return {
            status: 201,
            message: 'Provider created successfully',
            data: createProvider
        };
    }

    async findProductsByProviderId(id: number, pagination: PaginationDto): Promise<Response<Product[]>> {
        const { limit = 10, page = 1 } = pagination;
        const totalPage = await this.prisma.product.count({
            where: {
                providerId: id
            }
        });
        const lasPage = Math.ceil(totalPage / limit);
        const products = await this.prisma.product.findMany({
            where: {
                providerId: id
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            take: limit,
            skip: (page - 1) * limit
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
                lastPage: lasPage
            },
            data: products
        };
    }

    async findAll(pagination: PaginationDto): Promise<Response<Provider[]>> {
        const { limit = 10, page = 1 } = pagination;
        const totalPage = await this.prisma.provider.count();
        const lasPage = Math.ceil(totalPage / limit);
        const providers = await this.prisma.provider.findMany({
            take: limit,
            skip: (page - 1) * limit
        });
        if (!providers) {
            throw new BadRequestException('Providers not found');
        }
        return {
            status: 200,
            message: 'Providers found successfully',
            pagination: {
                limit,
                page,
                total: totalPage,
                lastPage: lasPage
            },
            data: providers
        };
    }

    async findOne(id: number): Promise<Response<Provider>> {
        const provider = await this.prisma.provider.findUnique({
            where: {
                id
            }
        });
        if (!provider) {
            throw new BadRequestException('Provider not found');
        }
        return {
            status: 200,
            message: 'Provider found successfully',
            data: provider
        };
    }

    async share(shareDto: SheareDto): Promise<Response<Provider[]>> {
        const orConditions: any[] = [];
        
        if (shareDto.name) {
            orConditions.push({
                name: {
                    contains: shareDto.name,
                    mode: 'insensitive',
                }
            });
        }
        
        if (shareDto.email) {
            orConditions.push({
                email: {
                    contains: shareDto.email,
                    mode: 'insensitive',
                }
            });
        }
        
        if (shareDto.phone) {
            orConditions.push({
                phone: {
                    contains: shareDto.phone,
                    mode: 'insensitive',
                }
            });
        }
        
        if (orConditions.length === 0) {
            throw new BadRequestException('No data to search');
        }
    
        const provider = await this.prisma.provider.findMany({
            where: {
                OR: orConditions
            }
        });
        
        if (!provider || provider.length === 0) {
            throw new BadRequestException('Provider not found');
        }
        
        return {
            status: 200,
            message: 'Provider found successfully',
            data: provider
        };
    }

    async update(id: number, data: UpdateProviderDto): Promise<Response<Provider>> {
        const updateProvider = await this.prisma.provider.update({
            where: {
                id
            },
            data: {
                name: data.name,
                email: data.email!,
                phone: data.phone!,
                address: data.address!
            }
        });
        if (!updateProvider) {
            throw new BadRequestException('Provider not updated');
        }
        return {
            status: 200,
            message: 'Provider updated successfully',
            data: updateProvider
        };
    }

    async delete(id: number): Promise<Response<Provider>> {
        const deleteProvider = await this.prisma.provider.delete({
            where: {
                id
            }
        });
        if (!deleteProvider) {
            throw new BadRequestException('Provider not deleted');
        }
        return {
            status: 200,
            message: 'Provider deleted successfully',
            data: deleteProvider
        };
    }
}
