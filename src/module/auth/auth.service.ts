import { PrismaService } from '@/core/prisma.service';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from '@/utils/response';
import { User } from '../../../prisma/generated/prisma';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PayloadDto } from './dto/payload.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly bcryptService: BcryptService,
        private readonly jwtService: JwtService
    ){}

    async register(registerDto: RegisterDto): Promise<Response<User>> {
        const user = await this.prisma.user.findUnique({ 
            where: { email: registerDto.email } 
        })
        if (user) {
            throw new ConflictException('User already exists')
        }
        const hashedPassword = await this.bcryptService.hashPassword(registerDto.password)
        const newUser = await this.prisma.user.create({ 
            data: { 
                email: registerDto.email, 
                password: hashedPassword,
                name: registerDto.name,
                role: registerDto.role
            } 
        })
        return {
            status: 201,
            message: 'User created',
            data: newUser
        }
    }

    async login(loginDto: LoginDto): Promise<Response<{user: User, token: string}>> {
        const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } })
        if (!user) {
            throw new NotFoundException('User not found')
        }
        const isPasswordValid = await this.bcryptService.comparePassword(loginDto.password!, user.password)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password')
        }

        const payload: PayloadDto = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }

        const token = this.jwtService.sign(payload)

        return {
            status: 200,
            message: 'User logged in',
            data: {
                user,
                token
            }
        }
    }

    async getUserByEmail(email: string): Promise<Response<User>> {
        const user = await this.prisma.user.findUnique({ where: { email } })
        if (!user) {
            throw new NotFoundException('User not found')
        }
        return {
            status: 200,
            message: 'User found',
            data: user
        }
    }

    async updatePassword(email: string, password: string): Promise<Response<User>> {
        const user = await this.prisma.user.findUnique({ where: { email } })
        if (!user) {
            throw new NotFoundException('User not found')
        }
        const hashedPassword = await this.bcryptService.hashPassword(password)
        const updatedUser = await this.prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        })
        return {
            status: 200,
            message: 'User password updated',
            data: updatedUser
        }
    }


}
