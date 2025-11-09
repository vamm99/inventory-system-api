import { Controller } from '@nestjs/common';
import { DisheService } from './dishe.service';

@Controller('dishe')
export class DisheController {
  constructor(private readonly disheService: DisheService) {}
}
