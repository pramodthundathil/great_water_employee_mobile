import { colors } from './theme';

export const money = (v: number | string | null | undefined) =>
  `$${Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-12" or an ISO datetime -> "12 Nov 2026" (plain dates parsed without timezone shifts). */
export function fmtDate(v?: string | null): string {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return v;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function fmtDateTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** Local Date -> "YYYY-MM-DD" */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" -> local Date */
export function parseIsoDate(v: string): Date {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function days(n: number | string) {
  const v = Number(n);
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} day${v === 1 ? '' : 's'}`;
}

export type Tone = 'neutral' | 'pending' | 'success' | 'danger' | 'info';

export function statusTone(status: string): Tone {
  if (status.includes('REJECTED')) return 'danger';
  if (status === 'PAID' || status === 'APPROVED') return 'success';
  if (status === 'APPROVED_BY_DIRECTOR') return 'info';
  if (status === 'DRAFT' || status === 'WITHDRAWN') return 'neutral';
  return 'pending';
}

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: colors.muted, bg: '#EEF1F4' },
  pending: { fg: colors.warning, bg: colors.warningSoft },
  success: { fg: colors.success, bg: colors.successSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
};

export const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Employee',
  LEAD_MANAGER: 'Lead / Manager',
  ADMIN_MANAGER: 'Admin Manager',
  HR_COORDINATOR: 'HR Coordinator',
  DIRECTOR: 'Director',
};
