import sql from "..";

export async function insertServerMetrics(
  serverId: string,
  data: {
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
): Promise<void> {
  await sql`
    INSERT INTO server_metrics (
      time, server_id,
      cpu_usage, cpu_count, load_average_1m, load_average_5m, load_average_15m,
      memory_usage, memory_total, memory_used, memory_available,
      disk_usage, disk_total, disk_used, disk_read_bytes, disk_write_bytes,
      network_in, network_out
    )
    VALUES (
      NOW(),
      ${serverId}::uuid,
      ${data.cpu_usage ?? null},
      ${data.cpu_count ?? null},
      ${data.load_average_1m ?? null},
      ${data.load_average_5m ?? null},
      ${data.load_average_15m ?? null},
      ${data.memory_usage ?? null},
      ${data.memory_total ?? null},
      ${data.memory_used ?? null},
      ${data.memory_available ?? null},
      ${data.disk_usage ?? null},
      ${data.disk_total ?? null},
      ${data.disk_used ?? null},
      ${data.disk_read_bytes ?? null},
      ${data.disk_write_bytes ?? null},
      ${data.network_in ?? null},
      ${data.network_out ?? null}
    )
  `;
}
