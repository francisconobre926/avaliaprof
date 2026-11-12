import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AdminPanelService } from './admin-panel.service';

/** Acções de estudantes e turmas (as do painel já se registam no próprio serviço). Nunca guarda o corpo do pedido: não há dados pessoais no registo. */
const ACCOES: Record<string, [string, string]> = {
  'POST /admin/students': ['ESTUDANTE_CRIADO', 'User'],
  'PATCH /admin/students/:id': ['ESTUDANTE_ALTERADO', 'User'],
  'PATCH /admin/students/:id/enrollment': ['MATRICULA_ALTERADA', 'User'],
  'POST /admin/students/:id/subjects': ['ESTUDANTE_CADEIRA_ASSOCIADA', 'User'],
  'DELETE /admin/students/:id/subjects/:courseSubjectId': ['ESTUDANTE_CADEIRA_REMOVIDA', 'User'],
  'POST /admin/class-groups': ['TURMA_CRIADA', 'ClassGroup'],
  'DELETE /admin/class-groups/:id': ['TURMA_APAGADA', 'ClassGroup'],
  'POST /admin/class-groups/:id/students': ['TURMA_ESTUDANTES_ADICIONADOS', 'ClassGroup'],
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private panel: AdminPanelService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const accao = ACCOES[`${req.method} ${req.route?.path}`];
    if (!accao) return next.handle();
    return next.handle().pipe(
      tap(() => { void this.panel.audit(req.user.userId, accao[0], accao[1], req.params?.id).catch(() => undefined); }),
    );
  }
}
