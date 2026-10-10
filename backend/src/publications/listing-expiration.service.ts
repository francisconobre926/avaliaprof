import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListingExpirationService {
  private logger = new Logger('ListingExpirationService');

  constructor(private prisma: PrismaService) {}

  /** Corre de hora a hora e expira anúncios cujo prazo já passou. */
  @Cron(CronExpression.EVERY_HOUR)
  async expireListings() {
    const result = await this.prisma.listing.updateMany({
      where: {
        status: 'ACTIVO',
        expiresAt: { not: null, lt: new Date() },
      },
      data: { status: 'EXPIRADO' },
    });
    if (result.count > 0) {
      this.logger.log(`${result.count} anúncio(s) expirado(s).`);
    }
  }
}