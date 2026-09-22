import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UnlocksService } from './unlocks.service';
import { UnlocksController } from './unlocks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatsModule } from '../chats/chats.module';
import { PAYMENT_GATEWAY } from '../payments/gateways/payment-gateway.interface';
import { MockPaymentGateway } from '../payments/gateways/mock-payment.gateway';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' }), ChatsModule],
  controllers: [UnlocksController],
  providers: [
    UnlocksService,
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway },
  ],
})
export class UnlocksModule {}