import { Injectable, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import type { PushProvider, PushResult } from './push-provider.interface';

@Injectable()
export class FcmPushProvider implements PushProvider {
  private logger = new Logger('FcmPushProvider');
  private ready = false;

  constructor() {
    const path = process.env.FIREBASE_CREDENTIALS_PATH;
    if (!path || !fs.existsSync(path)) {
      this.logger.warn('Credenciais do Firebase não encontradas. Push desativado.');
      return;
    }
    if (getApps().length === 0) {
      initializeApp({ credential: cert(path) });
    }
    this.ready = true;
    this.logger.log('Firebase Admin inicializado.');
  }

  async send(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<PushResult> {
    if (!this.ready || tokens.length === 0) {
      return { invalidTokens: [] };
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (
        !r.success &&
        (code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token')
      ) {
        invalidTokens.push(tokens[i]);
      }
    });

    return { invalidTokens };
  }
}