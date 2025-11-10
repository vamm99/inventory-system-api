import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt'

@Injectable()
export class BcryptService {
    constructor(){}

    async hashPassword(password: string){
        const salt = await bcrypt.genSalt()
        return await bcrypt.hash(password, salt)
    }

    async comparePassword(password: string, hash: string){
        return await bcrypt.compare(password, hash)
    }
}