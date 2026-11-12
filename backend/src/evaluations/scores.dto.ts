import { IsInt, IsOptional, Max, Min } from 'class-validator';

const star = () => [IsInt(), Min(1), Max(5)];
const apply = (...d: PropertyDecorator[]) => (t: object, k: string) => d.forEach((f) => f(t, k));

export class ScoresDto {
  @apply(...star()) clarity: number;
  @apply(...star()) punctuality: number;
  @apply(...star()) availability: number;
  @apply(...star()) mastery: number;
  @apply(...star()) fairness: number;
}

export class PartialScoresDto {
  @IsOptional() @apply(...star()) clarity?: number;
  @IsOptional() @apply(...star()) punctuality?: number;
  @IsOptional() @apply(...star()) availability?: number;
  @IsOptional() @apply(...star()) mastery?: number;
  @IsOptional() @apply(...star()) fairness?: number;
}
