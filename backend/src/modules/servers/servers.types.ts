import { ServerStatus } from "../../types/enums";

export interface CreateServerInput {
  name: string;
  hostname?: string;
  ip_address?: string;
  os_type?: string;
  os_version?: string;
  agent_version?: string;
  tags?: string[];
}

export interface UpdateServerInput {
  name?: string;
  tags?: string[];
  status?: ServerStatus;
}

export interface ServerMetricsQuery {
  from?: string;
  to?: string;
  limit?: number;
}
