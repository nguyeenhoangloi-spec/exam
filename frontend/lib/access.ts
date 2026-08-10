import { Role } from '../types';

export const workspaceRoutes: Record<Role, string> = {
  ADMIN: '/dashboard',
  TEACHER: '/teacher/assignments',
  STUDENT: '/student/exam-schedule',
};

const routeAccess: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/dashboard', roles: ['ADMIN'] },
  { prefix: '/reports', roles: ['ADMIN'] },
  { prefix: '/departments', roles: ['ADMIN'] },
  { prefix: '/classes', roles: ['ADMIN'] },
  { prefix: '/students', roles: ['ADMIN'] },
  { prefix: '/teachers', roles: ['ADMIN'] },
  { prefix: '/subjects', roles: ['ADMIN'] },
  { prefix: '/exam-rooms', roles: ['ADMIN'] },
  { prefix: '/exam-periods', roles: ['ADMIN'] },
  { prefix: '/exam-schedules', roles: ['ADMIN'] },
  { prefix: '/exam-arrangement', roles: ['ADMIN'] },
  { prefix: '/exam-supervisors', roles: ['ADMIN'] },
  { prefix: '/question-bank', roles: ['ADMIN', 'TEACHER'] },
  { prefix: '/exam-papers', roles: ['ADMIN', 'TEACHER'] },
  {prefix: '/exam-reports', roles: ['ADMIN', 'TEACHER'] },
  { prefix: '/trash', roles: ['ADMIN'] },
  { prefix: '/teacher/assignments', roles: ['TEACHER'] },
  { prefix: '/teacher/essay-grading', roles: ['ADMIN', 'TEACHER'] },
  { prefix: '/admin/essay-review', roles: ['ADMIN'] },
  { prefix: '/teacher/proctor', roles: ['ADMIN', 'TEACHER'] },
  { prefix: '/student/exam-schedule', roles: ['STUDENT'] },
  { prefix: '/student/results', roles: ['STUDENT'] },
  { prefix: '/student/curriculum', roles: ['STUDENT'] },
  { prefix: '/profile', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { prefix: '/settings', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { prefix: '/change-password', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
];

export const canAccessPath = (role: Role | undefined, pathname: string) => {
  if (!role) return false;
  const rule = routeAccess
    .filter((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return rule ? rule.roles.includes(role) : false;
};
