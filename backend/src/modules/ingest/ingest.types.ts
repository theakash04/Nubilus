export interface RegisterServerInput {
  name: string;
  hostname?: string;
  ip_address?: string;
  os_type?: string;
  os_version?: string;
  agent_version?: string;
}

export interface SubmitMetricsInput {
  cpu_usage?: number;
  cpu_count?: number;
  load_average_1m?: number;
  load_average_5m?: number;
  load_average_15m?: number;
  memory_usage?: number;
  memory_total?: number;
  memory_used?: number;
  memory_available?: number;
  disk_usage?: number;
  disk_total?: number;
  disk_used?: number;
  disk_read_bytes?: number;
  disk_write_bytes?: number;
  network_in?: number;
  network_out?: number;
}

export interface SubmitHealthCheckInput {
  endpoint_id: string;
  status_code: number | null;
  response_time: number | null;
  is_up: boolean;
  error_message?: string;
  checked_from?: string;
}
