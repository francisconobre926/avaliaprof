export interface ChargeResult {
  success: boolean;
  transactionReference: string;
}

export interface PaymentGateway {
  charge(amount: number, phone: string): Promise<ChargeResult>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';