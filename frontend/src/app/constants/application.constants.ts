/** Single source for form fields and filters — matches backend `Application` model enums */

export const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
  'Remote',
] as const;

export const APPLICATION_STATUSES = [
  'Applied',
  'Under Review',
  'Interview Scheduled',
  'Offer Received',
  'Rejected',
  'Accepted',
  'Withdrawn',
] as const;

const STATUS_BADGE_MAP: Record<string, string> = {
  Applied: 'badge-applied',
  'Under Review': 'badge-under-review',
  'Interview Scheduled': 'badge-interview',
  'Offer Received': 'badge-offer',
  Rejected: 'badge-rejected',
  Accepted: 'badge-accepted',
  Withdrawn: 'badge-withdrawn',
};

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_MAP[status] || 'badge-applied';
}
