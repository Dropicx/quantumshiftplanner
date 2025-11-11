# Logging Configuration Guide

This document explains where logs are saved or printed in the API service.

## Quick Summary

- **Development**: Logs are printed to **console/terminal** (pretty, colored format)
- **Production**: Logs are printed to **console** (JSON format) AND saved to **log files** in `logs/` directory

---

## Development Mode (`NODE_ENV=development`)

### Where Logs Appear

- **Console/Terminal** - All logs are printed here in a human-readable, colored format

### Log Format Example

```
2025-01-15 10:30:45 info [HTTP][abc-123-def] Incoming request: GET /api/health {"method":"GET","url":"/api/health"}
2025-01-15 10:30:45 info [HTTP][abc-123-def] Outgoing response: GET /api/health 200 {"statusCode":200,"responseTime":"5ms"}
```

### Features

- ✅ Colorized output (errors in red, warnings in yellow, etc.)
- ✅ Human-readable format
- ✅ Shows context, correlation ID, and metadata
- ✅ Easy to read during development

---

## Production Mode (`NODE_ENV=production`)

### Where Logs Appear

#### 1. Console/Standard Output (STDOUT)

- **Location**: Terminal/console where the process runs
- **Format**: JSON (structured, machine-readable)
- **Purpose**: Can be captured by log aggregation systems (e.g., Railway, Docker, Kubernetes)

#### 2. Log Files (in `logs/` directory)

**Error Log File:**

- **Path**: `logs/error-YYYY-MM-DD.log`
- **Contains**: Only error-level logs
- **Rotation**: New file each day
- **Retention**: 14 days
- **Max Size**: 20MB per file
- **Compression**: Old files are zipped automatically

**Combined Log File:**

- **Path**: `logs/combined-YYYY-MM-DD.log`
- **Contains**: All log levels (info, warn, error, debug, verbose)
- **Rotation**: New file each day
- **Retention**: 14 days
- **Max Size**: 20MB per file
- **Compression**: Old files are zipped automatically

### Log Format Example (JSON)

```json
{
  "timestamp": "2025-01-15 10:30:45",
  "level": "info",
  "message": "Incoming request: GET /api/health",
  "context": "HTTP",
  "correlationId": "abc-123-def",
  "method": "GET",
  "url": "/api/health",
  "query": {},
  "params": {}
}
```

### Features

- ✅ Structured JSON format (easy to parse)
- ✅ Automatic log rotation (daily)
- ✅ Automatic cleanup (14 days retention)
- ✅ Automatic compression (saves disk space)
- ✅ Separate error log file (easier error tracking)

---

## Log Levels

The log level is controlled by the `LOG_LEVEL` environment variable:

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, and errors (default)
- `debug` - Debug, info, warnings, and errors
- `verbose` - All logs

### Setting Log Level

**Environment Variable:**

```bash
LOG_LEVEL=debug
```

**In `.env` file:**

```env
LOG_LEVEL=info
```

---

## Log File Directory Structure

```
apps/api/
├── logs/                          # Log files directory (created automatically)
│   ├── error-2025-01-15.log      # Today's error log
│   ├── error-2025-01-14.log      # Yesterday's error log
│   ├── error-2025-01-13.log.gz   # Compressed old error log
│   ├── combined-2025-01-15.log   # Today's combined log
│   ├── combined-2025-01-14.log   # Yesterday's combined log
│   └── combined-2025-01-13.log.gz # Compressed old combined log
└── src/
```

**Note**: The `logs/` directory is created automatically when the first log is written in production mode.

---

## What Gets Logged

### 1. HTTP Requests (via LoggingInterceptor)

- **Incoming requests**: Method, URL, query params, body (sanitized)
- **Outgoing responses**: Status code, response time
- **Correlation ID**: Unique ID for each request

### 2. Errors (via HttpExceptionFilter)

- **Error messages**: Full error details
- **Stack traces**: Complete stack trace for debugging
- **Request context**: Method, URL, headers, body
- **Correlation ID**: Links error to original request

### 3. Application Logs

- **Manual logging**: Anywhere you use `AppLoggerService`
- **Bootstrap logs**: Server startup messages
- **Health check logs**: (if you add logging to health service)

---

## Viewing Logs

### Development

Just watch your terminal where you run `pnpm dev` or `pnpm --filter @planday/api dev`

### Production - Console

```bash
# If running directly
node dist/src/main.js

# If using Docker
docker logs <container-name>

# If using Railway
railway logs
```

### Production - Log Files

```bash
# View today's error log
tail -f logs/error-$(date +%Y-%m-%d).log

# View today's combined log
tail -f logs/combined-$(date +%Y-%m-%d).log

# Search for errors
grep -i error logs/combined-*.log

# View all logs from a specific date
cat logs/combined-2025-01-15.log | jq '.'
```

---

## Log Rotation Details

### Daily Rotation

- New log file created at midnight (00:00:00)
- Filename includes date: `error-2025-01-15.log`

### Size Limits

- Maximum 20MB per file
- When limit reached, file is rotated immediately

### Retention

- Logs older than 14 days are automatically deleted
- Compressed files (`.gz`) are also deleted after 14 days

### Compression

- Files older than 1 day are automatically compressed
- Saves disk space significantly

---

## Example Log Outputs

### Development (Console)

```
2025-01-15 10:30:45 info [Bootstrap] 🚀 API Server is running!
2025-01-15 10:30:45 info [Bootstrap] 📍 URL: http://localhost:4000
2025-01-15 10:30:50 info [HTTP][abc-123] Incoming request: GET /api/health
2025-01-15 10:30:50 info [HTTP][abc-123] Outgoing response: GET /api/health 200 {"responseTime":"5ms"}
2025-01-15 10:31:00 error [ExceptionFilter][abc-456] HTTP 404 GET /api/unknown - Not Found
```

### Production (JSON - Console/File)

```json
{"timestamp":"2025-01-15 10:30:45","level":"info","message":"🚀 API Server is running!","context":"Bootstrap"}
{"timestamp":"2025-01-15 10:30:50","level":"info","message":"Incoming request: GET /api/health","context":"HTTP","correlationId":"abc-123","method":"GET","url":"/api/health"}
{"timestamp":"2025-01-15 10:30:50","level":"info","message":"Outgoing response: GET /api/health 200","context":"HTTP","correlationId":"abc-123","statusCode":200,"responseTime":"5ms"}
{"timestamp":"2025-01-15 10:31:00","level":"error","message":"HTTP 404 GET /api/unknown - Not Found","context":"ExceptionFilter","correlationId":"abc-456","statusCode":404,"stack":"Error: Not Found\n    at ..."}
```

---

## Troubleshooting

### Logs not appearing?

1. Check `NODE_ENV` environment variable
2. Check `LOG_LEVEL` environment variable
3. Verify `logs/` directory has write permissions (production)

### Log files not created?

1. Ensure `NODE_ENV=production`
2. Check write permissions in the `logs/` directory
3. Verify the application is actually logging (check console output)

### Too many log files?

- Logs are automatically cleaned up after 14 days
- You can manually delete old log files if needed
- Adjust retention in `logger.service.ts` if needed

---

## Configuration File

The logging configuration is in:

- `apps/api/src/common/logger/logger.service.ts`

To modify:

- Log file paths: Change `filename` in `DailyRotateFile` options
- Retention period: Change `maxFiles` (currently `'14d'`)
- Max file size: Change `maxSize` (currently `'20m'`)
- Log formats: Modify `developmentFormat` or `productionFormat`

---

## Summary

| Environment | Console Output   | File Output    | Format          |
| ----------- | ---------------- | -------------- | --------------- |
| Development | ✅ Yes (colored) | ❌ No          | Pretty/Readable |
| Production  | ✅ Yes (JSON)    | ✅ Yes (logs/) | JSON/Structured |

**Key Points:**

- Development: Easy-to-read console output
- Production: JSON console + daily rotating log files
- All logs include correlation IDs for request tracking
- Automatic rotation, compression, and cleanup
