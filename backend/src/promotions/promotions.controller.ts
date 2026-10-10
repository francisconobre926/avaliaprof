import { Controller, Get } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private service: PromotionsService) {}

  // Público: a app mostra as promoções a decorrer
  @Get('active')
  findActive() {
    return this.service.findActive();
  }
}