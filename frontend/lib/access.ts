import { Role } from '../types';

export const workspaceRoutes: Record<Role, string> = {
  ADMIN: '/dashboard',
  TEACHER: '/teacher/assignments',
  STUDENT: '/student/exam-schedule',
};

type RouteAccessRule = {
  prefix: string;
  roles: Role[];
  permission?: string;
};

const routeAccess: RouteAccessRule[] = [
  { prefix: '/dashboard', roles: ['ADMIN'], permission: 'SYSTEM_REPORT_VIEW' },
  { prefix: '/reports', roles: ['ADMIN'] },
  { prefix: '/departments', roles: ['ADMIN'], permission: 'ACADEMIC_STRUCTURE_MANAGE' },
  { prefix: '/classes', roles: ['ADMIN'], permission: 'ACADEMIC_STRUCTURE_MANAGE' },
  { prefix: '/students', roles: ['ADMIN'], permission: 'USER_MANAGE' },
  { prefix: '/teachers', roles: ['ADMIN'], permission: 'USER_MANAGE' },
  { prefix: '/subjects', roles: ['ADMIN'], permission: 'ACADEMIC_STRUCTURE_MANAGE' },
  { prefix: '/exam-rooms', roles: ['ADMIN'], permission: 'EXAM_ROOM_MANAGE' },
  { prefix: '/exam-periods', roles: ['ADMIN'], permission: 'EXAM_PERIOD_MANAGE' },
  { prefix: '/exam-schedules', roles: ['ADMIN', 'TEACHER'], permission: 'EXAM_SCHEDULE_MANAGE' },
  { prefix: '/exam-arrangement', roles: ['ADMIN'], permission: 'EXAM_ARRANGEMENT_MANAGE' },
  { prefix: '/exam-supervisors', roles: ['ADMIN'], permission: 'EXAM_SUPERVISOR_MANAGE' },
  { prefix: '/question-bank', roles: ['ADMIN', 'TEACHER'], permission: 'QUESTION_MANAGE' },
  { prefix: '/exam-papers', roles: ['ADMIN', 'TEACHER'], permission: 'EXAM_PAPER_MANAGE' },
  { prefix: '/exam-reports', roles: ['ADMIN', 'TEACHER'], permission: 'EXAM_REPORT_VIEW' },
  { prefix: '/trash', roles: ['ADMIN'], permission: 'TRASH_MANAGE' },
  { prefix: '/admin/backups', roles: ['ADMIN'], permission: 'BACKUP_MANAGE' },
  { prefix: '/admin/settings/google-drive/callback', roles: ['ADMIN'], permission: 'BACKUP_MANAGE' },
  { prefix: '/admin/settings', roles: ['ADMIN'], permission: 'BACKUP_MANAGE' },
  { prefix: '/admin/activity-logs', roles: ['ADMIN'], permission: 'AUDIT_LOG_VIEW' },
  { prefix: '/admin/security-audit', roles: ['ADMIN'], permission: 'SECURITY_AUDIT_VIEW' },
  { prefix: '/admin/access-control', roles: ['ADMIN'], permission: 'ACCESS_CONTROL_VIEW' },
  { prefix: '/admin/document-templates', roles: ['ADMIN'], permission: 'DOCUMENT_TEMPLATE_MANAGE' },
  { prefix: '/teacher/assignments', roles: ['TEACHER'], permission: 'PROCTOR_ASSIGNMENT_VIEW' },
  { prefix: '/teacher/essay-grading', roles: ['ADMIN', 'TEACHER'], permission: 'ESSAY_GRADE' },
  { prefix: '/admin/essay-review', roles: ['ADMIN'], permission: 'ESSAY_PUBLISH' },
  { prefix: '/teacher/regrade', roles: ['ADMIN', 'TEACHER'], permission: 'GRADE_APPEAL_REVIEW' },
  { prefix: '/admin/grade-appeals', roles: ['ADMIN'], permission: 'GRADE_APPEAL_REVIEW' },
  { prefix: '/teacher/proctor', roles: ['ADMIN', 'TEACHER'] },
  { prefix: '/student/exam-schedule', roles: ['STUDENT'], permission: 'STUDENT_SCHEDULE_VIEW' },
  { prefix: '/student/results', roles: ['STUDENT'], permission: 'STUDENT_RESULT_VIEW' },
  { prefix: '/student/curriculum', roles: ['STUDENT'], permission: 'STUDENT_CURRICULUM_VIEW' },
  { prefix: '/student/online-exam', roles: ['STUDENT'], permission: 'ONLINE_EXAM_TAKE' },
];

export const canAccessPath = (
  role: Role | undefined,
  pathname: string,
  effectivePermissions?: ReadonlySet<string> | null,
) => {
  if (!role) return false;
  const cleanPath = (pathname || '').split('?')[0];
  const rule = routeAccess
    .filter((item) => cleanPath === item.prefix || cleanPath.startsWith(`${item.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (!rule || !rule.roles.includes(role)) return false;
  if (!rule.permission || effectivePermissions == null) return true;
  return effectivePermissions.has(rule.permission);
};

const workspaceCandidates: Record<Role, string[]> = {
  ADMIN: ['/dashboard', '/admin/access-control'],
  TEACHER: ['/teacher/assignments', '/exam-schedules', '/question-bank'],
  STUDENT: ['/student/exam-schedule', '/student/results', '/student/curriculum'],
};

export const resolveWorkspaceRoute = (
  role: Role,
  effectivePermissions?: ReadonlySet<string> | null,
) => workspaceCandidates[role].find((path) => canAccessPath(role, path, effectivePermissions)) || (role === 'STUDENT' ? '/student/exam-schedule' : role === 'TEACHER' ? '/teacher/assignments' : '/dashboard');

