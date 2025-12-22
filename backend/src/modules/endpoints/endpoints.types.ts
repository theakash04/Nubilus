import { HttpMethod } from "../../types/enums";

export interface CreateEndpointInput {
  name: string;
  url: string;
  server_id?: string;
  check_interval?: number;
  timeout?: number;
  method?: HttpMethod;
  expected_status_code?: number;
  tags?: string[];
}

export interface UpdateEndpointInput {
  name?: string;
  url?: string;
  check_interval?: number;
  timeout?: number;
  method?: HttpMethod;
  expected_status_code?: number;
  enabled?: boolean;
  tags?: string[];
}

export interface HealthCheckQuery {
  from?: string;
  to?: string;
  limit?: number;
}
