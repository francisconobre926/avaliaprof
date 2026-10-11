import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Deixa passar pedidos sem sessão. Se houver um token válido, preenche o
 * request.user; se faltar ou for inválido (incluindo o token temporário do
 * 2FA), o pedido segue como anónimo em vez de dar erro 401.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(_err: unknown, user: any) {
    return user || undefined;
  }
}