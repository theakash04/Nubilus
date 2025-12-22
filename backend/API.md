# Nubilus API Documentation

Base URL: `http://localhost:8000/api`

## Authentication

Most endpoints require authentication via cookies. Login first, then use the cookies in subsequent requests.

---

## Auth

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Get Current User
```
GET /api/auth/user
Cookie: accessToken=...; refreshToken=...
```

### Logout
```
GET /api/auth/logout
Cookie: accessToken=...; refreshToken=...
```

---

## Organizations

### List My Organizations
```
GET /api/org
Cookie: accessToken=...; refreshToken=...
```

### Create Organization
```
POST /api/org
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "My Company"
}
```

### Get Organization
```
GET /api/org/:orgId
Cookie: accessToken=...; refreshToken=...
```

### Update Organization
```
PUT /api/org/:orgId
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "Updated Name",
  "webhook_url": "https://hooks.example.com/alerts"
}
```

---

## API Keys

### List API Keys
```
GET /api/org/:orgId/keys
Cookie: accessToken=...; refreshToken=...
```

### Create API Key
```
POST /api/org/:orgId/keys
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "Production Agent"
}
```
**Response includes the full key (only shown once):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "nub_abc123...",
    "key_prefix": "nub_abc12345",
    "name": "Production Agent"
  }
}
```

### Revoke API Key
```
DELETE /api/org/:orgId/keys/:keyId
Cookie: accessToken=...; refreshToken=...
```

---

## Servers

### List Servers
```
GET /api/org/:orgId/servers
Cookie: accessToken=...; refreshToken=...
```

### Get Server
```
GET /api/org/:orgId/servers/:serverId
Cookie: accessToken=...; refreshToken=...
```

### Update Server
```
PUT /api/org/:orgId/servers/:serverId
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "New Server Name",
  "tags": ["production", "web"]
}
```

### Delete Server
```
DELETE /api/org/:orgId/servers/:serverId
Cookie: accessToken=...; refreshToken=...
```

### Get Server Metrics
```
GET /api/org/:orgId/servers/:serverId/metrics?from=2024-01-01T00:00:00Z&to=2024-12-31T23:59:59Z&limit=100
Cookie: accessToken=...; refreshToken=...
```

---

## Endpoints (HTTP Monitoring)

### List Endpoints
```
GET /api/org/:orgId/endpoints
Cookie: accessToken=...; refreshToken=...
```

### Create Endpoint
```
POST /api/org/:orgId/endpoints
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "API Health Check",
  "url": "https://api.example.com/health",
  "check_interval": 60,
  "timeout": 10,
  "method": "GET",
  "expected_status_code": 200,
  "tags": ["api", "critical"]
}
```

### Get Endpoint
```
GET /api/org/:orgId/endpoints/:endpointId
Cookie: accessToken=...; refreshToken=...
```

### Update Endpoint
```
PUT /api/org/:orgId/endpoints/:endpointId
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "check_interval": 30,
  "enabled": true
}
```

### Delete Endpoint
```
DELETE /api/org/:orgId/endpoints/:endpointId
Cookie: accessToken=...; refreshToken=...
```

### Get Health Checks History
```
GET /api/org/:orgId/endpoints/:endpointId/checks?limit=50
Cookie: accessToken=...; refreshToken=...
```

---

## Database Targets

### List Database Targets
```
GET /api/org/:orgId/databases
Cookie: accessToken=...; refreshToken=...
```

### Create Database Target
```
POST /api/org/:orgId/databases
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "Production PostgreSQL",
  "db_type": "postgres",
  "connection_url": "postgresql://user:pass@host:5432/db",
  "check_interval": 60,
  "timeout": 10
}
```
**db_type options:** `postgres`, `mysql`, `mongo`, `redis`, `mariadb`

### Get Database Target
```
GET /api/org/:orgId/databases/:dbId
Cookie: accessToken=...; refreshToken=...
```

### Update Database Target
```
PUT /api/org/:orgId/databases/:dbId
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "check_interval": 30,
  "enabled": false
}
```

### Delete Database Target
```
DELETE /api/org/:orgId/databases/:dbId
Cookie: accessToken=...; refreshToken=...
```

### Get Database Metrics
```
GET /api/org/:orgId/databases/:dbId/metrics?limit=100
Cookie: accessToken=...; refreshToken=...
```

---

## Alert Rules

### List Alert Rules
```
GET /api/org/:orgId/alert-rules
Cookie: accessToken=...; refreshToken=...
```

### Create Alert Rule
```
POST /api/org/:orgId/alert-rules
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "name": "High CPU Alert",
  "description": "Alert when CPU exceeds 80%",
  "rule_type": "high_cpu",
  "target_type": "server",
  "target_id": "server-uuid-here",
  "threshold_value": 80,
  "threshold_duration": 300,
  "comparison_operator": ">",
  "notify_email": true,
  "notify_webhook": false
}
```
**rule_type options:** `endpoint_down`, `high_cpu`, `high_memory`, `disk_full`, `high_load`, `database_down`  
**target_type options:** `endpoint`, `server`, `database`  
**comparison_operator options:** `>`, `<`, `=`, `>=`, `<=`

### Get Alert Rule
```
GET /api/org/:orgId/alert-rules/:ruleId
Cookie: accessToken=...; refreshToken=...
```

### Update Alert Rule
```
PUT /api/org/:orgId/alert-rules/:ruleId
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

{
  "threshold_value": 90,
  "enabled": true
}
```

### Delete Alert Rule
```
DELETE /api/org/:orgId/alert-rules/:ruleId
Cookie: accessToken=...; refreshToken=...
```

---

## Alerts

### List Alerts
```
GET /api/org/:orgId/alerts?status=open&limit=50
Cookie: accessToken=...; refreshToken=...
```
**status options:** `open`, `acknowledged`, `resolved`  
**severity options:** `info`, `warning`, `critical`

### Acknowledge Alert
```
PUT /api/org/:orgId/alerts/:alertId/acknowledge
Cookie: accessToken=...; refreshToken=...
```

### Resolve Alert
```
PUT /api/org/:orgId/alerts/:alertId/resolve
Cookie: accessToken=...; refreshToken=...
```

---

## Agent Ingestion API

These endpoints are called by monitoring agents using API key authentication.

### Register Server
```
POST /api/ingest/register
X-API-Key: nub_your_api_key_here
Content-Type: application/json

{
  "name": "web-server-01",
  "hostname": "web-01.example.com",
  "ip_address": "10.0.0.1",
  "os_type": "Linux",
  "os_version": "Ubuntu 22.04",
  "agent_version": "1.0.0"
}
```

### Submit Server Metrics
```
POST /api/ingest/metrics
X-API-Key: nub_your_api_key_here
Content-Type: application/json

{
  "cpu_usage": 45.5,
  "cpu_count": 8,
  "load_average_1m": 1.2,
  "load_average_5m": 1.0,
  "load_average_15m": 0.8,
  "memory_usage": 65.2,
  "memory_total": 17179869184,
  "memory_used": 11190558720,
  "memory_available": 5989310464,
  "disk_usage": 42.0,
  "disk_total": 107374182400,
  "disk_used": 45097156608,
  "disk_read_bytes": 1234567890,
  "disk_write_bytes": 987654321,
  "network_in": 5000000000,
  "network_out": 3000000000
}
```

### Heartbeat
```
POST /api/ingest/heartbeat
X-API-Key: nub_your_api_key_here
```

### Submit Health Check Result
```
POST /api/ingest/health
X-API-Key: nub_your_api_key_here
Content-Type: application/json

{
  "endpoint_id": "endpoint-uuid-here",
  "status_code": 200,
  "response_time": 125.5,
  "is_up": true,
  "error_message": null,
  "checked_from": "us-east-1"
}
```

---

## Response Format

All responses follow this format:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Description of result",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

---

## Testing Workflow

1. **Create a user** (if needed via signup endpoint or seed)
2. **Login** to get cookies
3. **Create organization**
4. **Create API key** for the agent
5. **Register server** using the API key
6. **Create endpoints** to monitor
7. **Create alert rules**
8. **Submit metrics** via ingest API
