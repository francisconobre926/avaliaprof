import { Injectable } from '@nestjs/common';
import type { PaymentGateway, ChargeResult } from './payment-gateway.interface';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  async charge(amount: number, phone: string): Promise<ChargeResult> {
    return {
      success: true,
      transactionReference: `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
  }
}