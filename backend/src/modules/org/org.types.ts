export interface Organization {
  id: string;
  name: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  webhook_url: string | null;
}

export interface OrganizationUser {
  organization_id: string;
  user_id: string;
  permissions: string[];
  joined_at: Date;
  status: string;
}

export interface CreateOrgInput {
  name: string;
}

export interface UpdateOrgInput {
  name?: string;
  webhook_url?: string | null;
}
