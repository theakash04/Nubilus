export interface Organization {
  id: string;
  name: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  webhook_url: string | null;
}
