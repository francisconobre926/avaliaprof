/**
 * Barrel export — src/components/ui/index.ts
 *
 * Permite importar todos os componentes a partir de um só caminho:
 *   import { Button, Input, Card, Modal, Badge, Avatar, Chip, EmptyState, SkeletonLoader, useToast } from '@/components/ui';
 */

export { Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputType } from './Input';

export { Card } from './Card';
export type { CardVariant } from './Card';

export { Modal } from './Modal';
export type { ModalVariant } from './Modal';

export { Badge } from './Badge';
export type { BadgeCor, BadgeSize } from './Badge';

export { Avatar } from './Avatar';
export type { AvatarSize } from './Avatar';

export { Chip } from './Chip';

export { EmptyState } from './EmptyState';

export { SkeletonLoader, SkeletonLinha, SkeletonCardProfessor } from './SkeletonLoader';
export type { SkeletonVariant } from './SkeletonLoader';

export { ToastProvider, useToast } from './Toast';
export type { ToastTipo, ToastPosicao } from './Toast';