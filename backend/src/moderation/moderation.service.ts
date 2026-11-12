import { Injectable } from '@nestjs/common';
import { ModerationEngine } from './moderation.engine';

/** Ponte para o contentor de injecção do Nest; a lógica vive em `ModerationEngine` (sem dependências). */
@Injectable()
export class ModerationService extends ModerationEngine {}

export { normalize } from './moderation.engine';
export type { ModerationResult, ModerationStatus, ModerationReason } from './moderation.engine';
