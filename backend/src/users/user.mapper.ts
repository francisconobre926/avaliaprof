import type { Course, User } from '@prisma/client';

export type UserWithCourse = User & { course: Course | null };

/** Forma pública do próprio utilizador. Nunca inclui password nem dados de recuperação. */
export function toUserDto(u: UserWithCourse) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    studentNumber: u.studentNumber,
    courseId: u.courseId,
    courseName: u.course?.name ?? null,
    photoUrl: u.photoUrl,
  };
}
