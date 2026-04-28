export type AnnouncementPriority = "normal" | "urgent";

export const ANNOUNCEMENT_PRIORITIES = ["normal", "urgent"] as const;
export const ANNOUNCEMENT_TITLE_MAX = 200;
export const ANNOUNCEMENT_BODY_MAX = 2000;

export interface Announcement {
  id: string;
  company_id: string;
  department_id: string | null;
  created_by: string;
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithMeta extends Announcement {
  department_name: string | null;
}

export interface AnnouncementWithRead extends AnnouncementWithMeta {
  is_read: boolean;
}
