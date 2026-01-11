import { Worker, Job } from "bullmq";
import { redisConnection } from "../connection";
import {
  MonitoringJobData,
  MONITORING_QUEUE_NAME,
  EndpointJobData,
  DatabaseJobData,
} from "./monitoring.queue";
import { insertHealthCheck } from "../../db/queries/endpoints";
import { insertDatabaseMetric } from "../../db/queries/databases";
import { addAlertNotification } from "../alerts/alerts.queue";
import { DatabaseType } from "../../types/enums";
import type { config as MssqlConfig } from "mssql";

/**
 * Check an HTTP endpoint
 */
async function checkEndpoint(data: EndpointJobData): Promise<{
  isUp: boolean;
  statusCode: number | null;
  responseTime: number;
  errorMessage: string | null;
}> {
  const startTime = Date.now();
  let isUp = false;
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), data.timeout * 1000);

    const response = await fetch(data.url, {
      method: data.method,
      signal: controller.signal,
      headers: {
        "User-Agent": "Nubilus-Monitor/1.0",
      },
    });

    clearTimeout(timeoutId);
    statusCode = response.status;

    // Check if status matches expected
    if (statusCode === data.expectedStatusCode) {
      isUp = true;
    } else {
      errorMessage = `Expected status ${data.expectedStatusCode}, got ${statusCode}`;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = `Timeout after ${data.timeout}s`;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = "Unknown error";
    }
  }

  const responseTime = Date.now() - startTime;
  return { isUp, statusCode, responseTime, errorMessage };
}

// Detailed database metrics interface
interface DatabaseMetricsResult {
  isHealthy: boolean;
  latency: number;
  errorMessage: string | null;
  connectionCount: number | null;
  activeConnections: number | null;
  idleConnections: number | null;
  queriesPerSecond: number | null;
  slowQueries: number | null;
  avgQueryTimeMs: number | null;
  cacheHitRatio: number | null;
  dbSizeBytes: number | null;
  tableCount: number | null;
}

/**
 * Check database connectivity and collect detailed metrics
 */
async function checkDatabase(data: DatabaseJobData): Promise<DatabaseMetricsResult> {
  const startTime = Date.now();
  let result: DatabaseMetricsResult = {
    isHealthy: false,
    latency: 0,
    errorMessage: null,
    connectionCount: null,
    activeConnections: null,
    idleConnections: null,
    queriesPerSecond: null,
    slowQueries: null,
    avgQueryTimeMs: null,
    cacheHitRatio: null,
    dbSizeBytes: null,
    tableCount: null,
  };

  try {
    switch (data.dbType) {
      case DatabaseType.POSTGRESQL:
        result = await checkPostgres(data.connectionUrl, data.timeout);
        break;

      case DatabaseType.MYSQL:
        result = await checkMysql(data.connectionUrl, data.timeout);
        break;

      case DatabaseType.MONGODB:
        result = await checkMongoDB(data.connectionUrl, data.timeout);
        break;

      case DatabaseType.REDIS:
        result = await checkRedis(data.connectionUrl, data.timeout);
        break;

      case DatabaseType.MSSQL:
        result = await checkMssql(data.connectionUrl, data.timeout);
        break;

      default:
        result.errorMessage = `Unsupported database type: ${data.dbType}`;
    }
  } catch (error) {
    if (error instanceof Error) {
      result.errorMessage = error.message;
    } else {
      result.errorMessage = "Unknown error";
    }
  }

  result.latency = Date.now() - startTime;
  return result;
}

/**
 * Check PostgreSQL and collect detailed metrics
 */
async function checkPostgres(
  connectionUrl: string,
  timeoutSeconds: number
): Promise<DatabaseMetricsResult> {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: connectionUrl,
    connectionTimeoutMillis: timeoutSeconds * 1000,
    query_timeout: timeoutSeconds * 1000,
  });

  const result: DatabaseMetricsResult = {
    isHealthy: false,
    latency: 0,
    errorMessage: null,
    connectionCount: null,
    activeConnections: null,
    idleConnections: null,
    queriesPerSecond: null,
    slowQueries: null,
    avgQueryTimeMs: null,
    cacheHitRatio: null,
    dbSizeBytes: null,
    tableCount: null,
  };

  try {
    await client.connect();

    // Health check
    await client.query("SELECT 1");
    result.isHealthy = true;

    // Get connection stats
    const connStats = await client.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    if (connStats.rows[0]) {
      result.connectionCount = parseInt(connStats.rows[0].total) || 0;
      result.activeConnections = parseInt(connStats.rows[0].active) || 0;
      result.idleConnections = parseInt(connStats.rows[0].idle) || 0;
    }

    // Get cache hit ratio
    const cacheStats = await client.query(`
      SELECT 
        CASE WHEN blks_hit + blks_read > 0 
          THEN round((blks_hit::numeric / (blks_hit + blks_read)) * 100, 2)
          ELSE 100 
        END as cache_hit_ratio
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);
    if (cacheStats.rows[0]) {
      result.cacheHitRatio = parseFloat(cacheStats.rows[0].cache_hit_ratio) || null;
    }

    // Get database size
    const sizeStats = await client.query(`
      SELECT pg_database_size(current_database()) as db_size
    `);
    if (sizeStats.rows[0]) {
      result.dbSizeBytes = parseInt(sizeStats.rows[0].db_size) || null;
    }

    // Get table count
    const tableStats = await client.query(`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    if (tableStats.rows[0]) {
      result.tableCount = parseInt(tableStats.rows[0].table_count) || 0;
    }

    await client.end();
  } catch (error) {
    try {
      await client.end();
    } catch {}
    result.isHealthy = false;
    result.errorMessage = error instanceof Error ? error.message : "PostgreSQL connection failed";
  }

  return result;
}

/**
 * Check MySQL and collect detailed metrics
 */
async function checkMysql(
  connectionUrl: string,
  timeoutSeconds: number
): Promise<DatabaseMetricsResult> {
  const mysql = await import("mysql2/promise");

  const result: DatabaseMetricsResult = {
    isHealthy: false,
    latency: 0,
    errorMessage: null,
    connectionCount: null,
    activeConnections: null,
    idleConnections: null,
    queriesPerSecond: null,
    slowQueries: null,
    avgQueryTimeMs: null,
    cacheHitRatio: null,
    dbSizeBytes: null,
    tableCount: null,
  };

  let connection;
  try {
    connection = await mysql.createConnection({
      uri: connectionUrl,
      connectTimeout: timeoutSeconds * 1000,
    });

    // Health check
    await connection.query("SELECT 1");
    result.isHealthy = true;

    // Get connection stats
    const [threads] = (await connection.query("SHOW STATUS LIKE 'Threads_connected'")) as any[];
    if (threads && threads[0]) {
      result.connectionCount = parseInt(threads[0].Value) || 0;
    }

    // Get slow queries count
    const [slowQueries] = (await connection.query("SHOW STATUS LIKE 'Slow_queries'")) as any[];
    if (slowQueries && slowQueries[0]) {
      result.slowQueries = parseInt(slowQueries[0].Value) || 0;
    }

    // Get queries per second (Questions / Uptime)
    const [questions] = (await connection.query("SHOW STATUS LIKE 'Questions'")) as any[];
    const [uptime] = (await connection.query("SHOW STATUS LIKE 'Uptime'")) as any[];
    if (questions?.[0] && uptime?.[0]) {
      const qps = parseInt(questions[0].Value) / parseInt(uptime[0].Value);
      result.queriesPerSecond = Math.round(qps * 100) / 100;
    }

    // Get database size
    const [dbSize] = (await connection.query(`
      SELECT SUM(data_length + index_length) as size 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `)) as any[];
    if (dbSize && dbSize[0]) {
      result.dbSizeBytes = parseInt(dbSize[0].size) || null;
    }

    // Get table count
    const [tables] = (await connection.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `)) as any[];
    if (tables && tables[0]) {
      result.tableCount = parseInt(tables[0].count) || 0;
    }

    await connection.end();
  } catch (error) {
    try {
      if (connection) await connection.end();
    } catch {}
    result.isHealthy = false;
    result.errorMessage = error instanceof Error ? error.message : "MySQL connection failed";
  }

  return result;
}

/**
 * Check MongoDB and collect detailed metrics
 */
async function checkMongoDB(
  connectionUrl: string,
  timeoutSeconds: number
): Promise<DatabaseMetricsResult> {
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(connectionUrl, {
    serverSelectionTimeoutMS: timeoutSeconds * 1000,
    connectTimeoutMS: timeoutSeconds * 1000,
  });

  const result: DatabaseMetricsResult = {
    isHealthy: false,
    latency: 0,
    errorMessage: null,
    connectionCount: null,
    activeConnections: null,
    idleConnections: null,
    queriesPerSecond: null,
    slowQueries: null,
    avgQueryTimeMs: null,
    cacheHitRatio: null,
    dbSizeBytes: null,
    tableCount: null,
  };

  try {
    await client.connect();

    // Health check with ping
    const pingResult = await client.db().admin().ping();
    result.isHealthy = pingResult.ok === 1;

    // Get server status for metrics
    try {
      const serverStatus = await client.db().admin().serverStatus();

      // Connection stats
      if (serverStatus.connections) {
        result.connectionCount = serverStatus.connections.current || 0;
        result.activeConnections = serverStatus.connections.active || 0;
        result.idleConnections =
          (serverStatus.connections.current || 0) - (serverStatus.connections.active || 0);
      }

      // Query stats
      if (serverStatus.opcounters) {
        result.queriesPerSecond = serverStatus.opcounters.query || null;
      }
    } catch {}

    // Get database stats
    try {
      const dbStats = await client.db().stats();
      result.dbSizeBytes = dbStats.dataSize || null;
      result.tableCount = dbStats.collections || 0;
    } catch {}

    await client.close();
  } catch (error) {
    try {
      await client.close();
    } catch {}
    result.isHealthy = false;
    result.errorMessage = error instanceof Error ? error.message : "MongoDB connection failed";
  }

  return result;
}

/**
 * Check Redis and collect detailed metrics
 */
async function checkRedis(
  connectionUrl: string,
  timeoutSeconds: number
): Promise<DatabaseMetricsResult> {
  const IORedis = (await import("ioredis")).default;

  const redis = new IORedis(connectionUrl, {
    connectTimeout: timeoutSeconds * 1000,
    commandTimeout: timeoutSeconds * 1000,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  const result: DatabaseMetricsResult = {
    isHealthy: false,
    latency: 0,
    errorMessage: null,
    connectionCount: null,
    activeConnections: null,
    idleConnections: null,
    queriesPerSecond: null,
    slowQueries: null,
    avgQueryTimeMs: null,
    cacheHitRatio: null,
    dbSizeBytes: null,
    tableCount: null,
  };

  try {
    await redis.connect();

    // Health check with PING
    const pingResult = await redis.ping();
    result.isHealthy = pingResult === "PONG";

    // Get INFO for detailed stats
    const info = await redis.info();
    const infoLines = info.split("\r\n");
    const infoMap: Record<string, string> = {};
    for (const line of infoLines) {
      const [key, value] = line.split(":");
      if (key && value) {
        infoMap[key] = value;
      }
    }

    // Connection stats
    result.connectionCount = parseInt(infoMap["connected_clients"]) || 0;

    // Memory as "db size"
    result.dbSizeBytes = parseInt(infoMap["used_memory"]) || null;

    // Commands per second
    result.queriesPerSecond = parseFloat(infoMap["instantaneous_ops_per_sec"]) || null;

    // Cache hit ratio
    const hits = parseInt(infoMap["keyspace_hits"]) || 0;
    const misses = parseInt(infoMap["keyspace_misses"]) || 0;
    if (hits + misses > 0) {
      result.cacheHitRatio = Math.round((hits / (hits + misses)) * 10000) / 100;
    }

    // Key count as "table count"
    const dbInfo = infoMap["db0"];
    if (dbInfo) {
      const match = dbInfo.match(/keys=(\d+)/);
      if (match) {
        result.tableCount = parseInt(match[1]) || 0;
      }
    }

    await redis.quit();
  } catch (error) {
    try {
      await redis.quit();
    } catch {}
    result.isHealthy = false;
    result.errorMessage = error instanceof Error ? error.message : "Redis connection failed";
  }

  return result;
}

/**
 * Parse MSSQL connection URL into config object
 * Supports formats:
 * - mssql://user:password@host:port/database
 * - Server=host,port;Database=db;User Id=user;Password=pass;
 */
function parseMssqlConnectionUrl(connectionUrl: string): {
  server: string;
  port?: number;
  database: string;
  user: string;
  password: string;
} {
  // Try URL format first (mssql://user:pass@host:port/database)
  if (connectionUrl.startsWith("mssql://") || connectionUrl.startsWith("sqlserver://")) {
    const url = new URL(connectionUrl);
    return {
      server: url.hostname,
      port: url.port ? parseInt(url.port) : 1433,
      database: url.pathname.slice(1) || "master",
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  }

  // Try ADO.NET connection string format
  const parts: Record<string, string> = {};
  connectionUrl.split(";").forEach(part => {
    const [key, ...valueParts] = part.split("=");
    if (key && valueParts.length > 0) {
      parts[key.trim().toLowerCase()] = valueParts.join("=").trim();
    }
  });

  // Parse server and port (can be "host,port" or "host")
  let server = parts["server"] || parts["data source"] || "localhost";
  let port = 1433;
  if (server.includes(",")) {
    const [host, portStr] = server.split(",");
    server = host;
    port = parseInt(portStr) || 1433;
  }

  return {
    server,
    port,
    database: parts["database"] || parts["initial catalog"] || "master",
    user: parts["user id"] || parts["uid"] || parts["user"] || "",
    password: parts["password"] || parts["pwd"] || "",
  };
}

/**
 * Check Microsoft SQL Server and collect detailed metrics
 */
async function checkMssql(
  connectionUrl: string,
  timeoutSeconds: number
): Promise<DatabaseMetricsResult> {
  const sql = await import("mssql");

  const result: DatabaseMetricsResult = {
    isHealthy: false,
    latency: 0,
    errorMessage: null,
    connectionCount: null,
    activeConnections: null,
    idleConnections: null,
    queriesPerSecond: null,
    slowQueries: null,
    avgQueryTimeMs: null,
    cacheHitRatio: null,
    dbSizeBytes: null,
    tableCount: null,
  };

  let pool: InstanceType<typeof sql.ConnectionPool> | null = null;
  try {
    // Parse the connection URL into config
    const parsed = parseMssqlConnectionUrl(connectionUrl);

    const config: MssqlConfig = {
      server: parsed.server,
      port: parsed.port,
      database: parsed.database,
      user: parsed.user,
      password: parsed.password,
      options: {
        trustServerCertificate: true,
        connectTimeout: timeoutSeconds * 1000,
        requestTimeout: timeoutSeconds * 1000,
      },
    };

    pool = await sql.connect(config);

    // Health check
    await pool.request().query("SELECT 1");
    result.isHealthy = true;

    // Get connection stats
    const connStats = await pool.request().query(`
      SELECT 
        COUNT(*) as total_connections,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as active_connections,
        SUM(CASE WHEN status = 'sleeping' THEN 1 ELSE 0 END) as idle_connections
      FROM sys.dm_exec_sessions
      WHERE is_user_process = 1
    `);
    if (connStats.recordset[0]) {
      result.connectionCount = connStats.recordset[0].total_connections || 0;
      result.activeConnections = connStats.recordset[0].active_connections || 0;
      result.idleConnections = connStats.recordset[0].idle_connections || 0;
    }

    // Get database size
    const sizeStats = await pool.request().query(`
      SELECT 
        SUM(size * 8 * 1024) as db_size_bytes
      FROM sys.database_files
    `);
    if (sizeStats.recordset[0]) {
      result.dbSizeBytes = sizeStats.recordset[0].db_size_bytes || null;
    }

    // Get table count
    const tableStats = await pool.request().query(`
      SELECT COUNT(*) as table_count 
      FROM sys.tables
      WHERE type = 'U'
    `);
    if (tableStats.recordset[0]) {
      result.tableCount = tableStats.recordset[0].table_count || 0;
    }

    // Get cache hit ratio (buffer cache)
    const cacheStats = await pool.request().query(`
      SELECT 
        CASE 
          WHEN (a.cntr_value + b.cntr_value) > 0 
          THEN CAST(a.cntr_value * 100.0 / (a.cntr_value + b.cntr_value) AS DECIMAL(5,2))
          ELSE 100 
        END as cache_hit_ratio
      FROM sys.dm_os_performance_counters a
      JOIN sys.dm_os_performance_counters b 
        ON a.object_name = b.object_name
      WHERE a.counter_name = 'Buffer cache hit ratio'
        AND b.counter_name = 'Buffer cache hit ratio base'
        AND a.object_name LIKE '%Buffer Manager%'
    `);
    if (cacheStats.recordset[0]) {
      result.cacheHitRatio = parseFloat(cacheStats.recordset[0].cache_hit_ratio) || null;
    }

    await pool.close();
  } catch (error) {
    try {
      if (pool) await pool.close();
    } catch {}
    result.isHealthy = false;
    result.errorMessage = error instanceof Error ? error.message : "MSSQL connection failed";
  }

  return result;
}
/**
 * Get default port for database protocol (kept for reference)
 */
function getDefaultPort(protocol: string): number {
  const protocolMap: Record<string, number> = {
    "postgresql:": 5432,
    "postgres:": 5432,
    "mysql:": 3306,
    "mongodb:": 27017,
    "mongodb+srv:": 27017,
    "redis:": 6379,
  };
  return protocolMap[protocol] || 80;
}

/**
 * Monitoring worker that processes endpoint and database checks
 */
export const monitoringWorker = new Worker<MonitoringJobData>(
  MONITORING_QUEUE_NAME,
  async (job: Job<MonitoringJobData>) => {
    const { type, targetId, orgId } = job.data;

    console.log(`[Monitoring] Checking ${type} ${targetId}`);

    if (type === "endpoint") {
      const data = job.data as EndpointJobData;
      const result = await checkEndpoint(data);

      try {
        await insertHealthCheck({
          endpoint_id: targetId,
          status_code: result.statusCode,
          response_time: result.responseTime,
          is_up: result.isUp,
          error_message: result.errorMessage,
          checked_from: "scheduler",
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("foreign key constraint")) {
          console.log(
            `[Monitoring] Endpoint ${targetId} no longer exists, removing from monitoring`
          );
          const { removeEndpointMonitoring } = await import("./monitoring.scheduler");
          await removeEndpointMonitoring(targetId);
          return { skipped: true, reason: "target_deleted" };
        }
        throw error;
      }

      if (!result.isUp) {
        await addAlertNotification({
          orgId,
          type: "alert_triggered",
          title: "Endpoint Down",
          message: `Endpoint ${data.url} is not responding. ${result.errorMessage || ""}`,
        });
      }

      return result;
    } else {
      const data = job.data as DatabaseJobData;
      const result = await checkDatabase(data);

      // Store the database metric with error handling for orphaned jobs
      try {
        await insertDatabaseMetric({
          target_id: targetId,
          is_healthy: result.isHealthy,
          error_message: result.errorMessage,
          connection_count: result.connectionCount,
          active_connections: result.activeConnections,
          idle_connections: result.idleConnections,
          queries_per_second: result.queriesPerSecond,
          slow_queries: result.slowQueries,
          avg_query_time_ms: result.avgQueryTimeMs,
          cache_hit_ratio: result.cacheHitRatio,
          db_size_bytes: result.dbSizeBytes,
          table_count: result.tableCount,
        });
      } catch (error) {
        // If foreign key constraint fails, the target was deleted - remove the monitoring job
        if (error instanceof Error && error.message.includes("foreign key constraint")) {
          console.log(
            `[Monitoring] Database ${targetId} no longer exists, removing from monitoring`
          );
          const { removeDatabaseMonitoring } = await import("./monitoring.scheduler");
          await removeDatabaseMonitoring(targetId);
          return { skipped: true, reason: "target_deleted" };
        }
        throw error;
      }

      // Trigger alert if database is unhealthy
      if (!result.isHealthy) {
        await addAlertNotification({
          orgId,
          type: "alert_triggered",
          title: "Database Unreachable",
          message: `Database ${data.dbType} is not responding. ${result.errorMessage || ""}`,
        });
      }

      return result;
    }
  },
  {
    connection: redisConnection,
    concurrency: 20, // Process multiple checks in parallel
  }
);

monitoringWorker.on("completed", job => {
  console.log(`[Monitoring] Check completed for ${job.data.type} ${job.data.targetId}`);
});

monitoringWorker.on("failed", (job, err) => {
  console.error(
    `[Monitoring] Check failed for ${job?.data.type} ${job?.data.targetId}:`,
    err.message
  );
});
