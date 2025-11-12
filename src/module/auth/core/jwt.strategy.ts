import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import {ConfigService} from "@nestjs/config";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PayloadDto } from "../dto/payload.dto";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService
    ){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwtSecret') || '' ,
        })
    }

    async validate(payload: PayloadDto) {
        const existingUser = await this.authService.getUserByEmail(payload.email)
        if (!existingUser) {
            throw new NotFoundException('User not found')
        }
        return existingUser
    }
}