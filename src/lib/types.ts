export type Role = 'EMPLOYEE' | 'LEAD_MANAGER' | 'ADMIN_MANAGER' | 'HR_COORDINATOR' | 'DIRECTOR';

export interface User {
  id: number;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone: string;
  primary_branch: { id: number; code: string; name: string } | null;
  profile: {
    designation: string;
    department: { id: number; name: string } | null;
    reporting_lead_name?: string;
    date_of_joining: string;
    emergency_contact: string;
    bank_name: string;
    bank_account_no: string;
    bank_ifsc_or_swift: string;
    address: string;
  } | null;
}

export interface LeaveBalance {
  leave_type_id: number;
  leave_type_code: string;
  leave_type_name: string;
  is_paid?: boolean;
  is_accrual_based: boolean;
  earned_days: number;
  taken_days: number;
  pending_days: number;
  available_balance: number;
  effective_remaining: number;
}

export interface ClaimListItem {
  id: number;
  claim_number: string;
  expense_date: string;
  amount: string;
  description: string;
  status: string;
  status_display: string;
  category_name: string;
  employee_name: string;
  employee_id_str: string;
  attachments_count: number;
  created_at: string;
}

export interface Approval {
  id: number;
  stage: string;
  approver_name: string;
  action: string;
  remarks: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  file_url: string;
  original_filename: string;
  file_type: string;
  file_size: number;
}

export interface ClaimDetail {
  id: number;
  claim_number: string;
  expense_date: string;
  amount: string;
  description: string;
  project_reference: string;
  status: string;
  status_display: string;
  category: { id: number; name: string };
  employee: { id: number; employee_id: string; full_name: string; designation: string };
  branch: { code: string; name: string };
  attachments: Attachment[];
  approval_history: Approval[];
  payment_record: {
    payment_date: string;
    payment_mode: string;
    payment_reference: string;
    recorded_by_name: string;
  } | null;
  submitted_at: string | null;
  created_at: string;
}

export interface LeaveListItem {
  id: number;
  application_number: string;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period: string;
  number_of_days: string;
  reason: string;
  status: string;
  status_display: string;
  leave_type_code: string;
  leave_type_name: string;
  employee_name: string;
  submitted_at: string;
}

export interface LeaveDetail {
  id: number;
  application_number: string;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period: string;
  number_of_days: string;
  reason: string;
  status: string;
  status_display: string;
  leave_type: { id: number; name: string; code: string };
  employee: { id: number; employee_id: string; full_name: string; designation: string };
  branch: { code: string; name: string };
  attachment_url: string | null;
  approval_history: Approval[];
  submitted_at: string;
}

export interface ApprovalAction {
  value: string;
  label: string;
  requires_remarks: boolean;
  tone: 'positive' | 'negative';
}

export interface PendingItem {
  kind: 'expense' | 'leave';
  id: number;
  reference: string;
  employee_name: string;
  employee_id: string;
  branch_code: string;
  title: string;
  subtitle: string;
  amount?: number;
  days?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
  status_display: string;
  stage: string;
  submitted_at: string | null;
  endpoint: string;
  actions: ApprovalAction[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  event_type: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
}

export interface Option {
  id: number;
  name: string;
  code?: string;
  requires_attachment?: boolean;
  is_paid?: boolean;
}
