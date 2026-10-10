import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { PAYMENT_GATEWAY } from '../payments/gateways/payment-gateway.interface';
import { MockPaymentGateway } from '../payments/gateways/mock-payment.gateway';
import { ListingExpirationService } from './listing-expiration.service';
import { SearchRequestsModule } from '../search-requests/search-requests.module';

@Module({
  imports: [
    PrismaModule,
    PricingModule,
    SearchRequestsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    ListingExpirationService,
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway },
  ],
})
export class PublicationsModule {}