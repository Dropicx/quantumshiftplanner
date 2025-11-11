# API Reference

Complete REST API documentation for Planday Clone.

**Base URL:** `https://api.yourdomain.com/v1`
**Authentication:** Bearer Token (JWT from Clerk)

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Organizations](#organizations)
- [Users & Employees](#users--employees)
- [Locations](#locations)
- [Shifts](#shifts)
- [Schedules](#schedules)
- [Time Tracking](#time-tracking)
- [Leave Requests](#leave-requests)
- [Shift Swaps](#shift-swaps)
- [Notifications](#notifications)
- [Messages](#messages)
- [Documents](#documents)
- [Reports](#reports)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All API requests (except webhooks and health checks) require authentication via Clerk JWT token.

### Request Headers

```http
GET /v1/shifts
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

### Get Token

```typescript
// Frontend (React/Next.js)
import { useAuth } from '@clerk/nextjs';

const { getToken } = useAuth();
const token = await getToken();

// Make API request
const response = await fetch('https://api.yourdomain.com/v1/shifts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

---

## 🏢 Organizations

### Get Current Organization

```http
GET /v1/organizations/me
```

**Response:**
```json
{
  "id": "uuid",
  "clerkOrgId": "org_xxx",
  "name": "ACME Corp",
  "slug": "acme-corp",
  "logoUrl": "https://...",
  "timezone": "Europe/Berlin",
  "subscriptionTier": "pro",
  "subscriptionStatus": "active",
  "settings": {
    "workWeekStart": 1,
    "defaultShiftDuration": 8
  },
  "createdAt": "2025-11-01T00:00:00Z"
}
```

### Update Organization

```http
PATCH /v1/organizations/me
```

**Request Body:**
```json
{
  "name": "New Name",
  "timezone": "America/New_York",
  "settings": {
    "workWeekStart": 0
  }
}
```

**Response:** Updated organization object

---

## 👥 Users & Employees

### List Employees

```http
GET /v1/employees?page=1&limit=20&search=john&locationId=uuid&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name or email
- `locationId` (optional): Filter by location
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": "https://..."
      },
      "employeeNumber": "EMP001",
      "locationId": "uuid",
      "hireDate": "2025-01-01",
      "contractType": "full_time",
      "contractedHoursPerWeek": 40,
      "hourlyRate": 25.00,
      "isActive": true,
      "skills": ["barista", "cashier"],
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Get Employee

```http
GET /v1/employees/:id
```

**Response:** Single employee object

### Create Employee

```http
POST /v1/employees
```

**Request Body:**
```json
{
  "userId": "uuid",
  "employeeNumber": "EMP002",
  "locationId": "uuid",
  "hireDate": "2025-12-01",
  "contractType": "part_time",
  "contractedHoursPerWeek": 20,
  "hourlyRate": 20.00,
  "skills": ["server"]
}
```

**Response:** Created employee object (201)

### Update Employee

```http
PATCH /v1/employees/:id
```

**Request Body:** Partial employee object

**Response:** Updated employee object

### Delete Employee

```http
DELETE /v1/employees/:id
```

**Response:** 204 No Content

---

## 📍 Locations

### List Locations

```http
GET /v1/locations
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Downtown Store",
      "address": "123 Main St, City",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timezone": "America/New_York",
      "settings": {
        "openingHours": {
          "monday": { "open": "09:00", "close": "17:00" }
        }
      },
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ]
}
```

### Create Location

```http
POST /v1/locations
```

**Request Body:**
```json
{
  "name": "Uptown Store",
  "address": "456 High St, City",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "timezone": "America/New_York"
}
```

---

## 📅 Shifts

### List Shifts

```http
GET /v1/shifts?startDate=2025-12-01&endDate=2025-12-31&employeeId=uuid&locationId=uuid&status=scheduled
```

**Query Parameters:**
- `startDate` (required): Start date (ISO 8601)
- `endDate` (required): End date (ISO 8601)
- `employeeId` (optional): Filter by employee
- `locationId` (optional): Filter by location
- `status` (optional): scheduled, approved, draft, open, for_sale

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "scheduleId": "uuid",
      "locationId": "uuid",
      "employeeId": "uuid",
      "employee": {
        "id": "uuid",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "positionId": "uuid",
      "position": {
        "name": "Barista",
        "color": "#3b82f6"
      },
      "shiftTypeId": "uuid",
      "shiftType": {
        "name": "Morning",
        "shortCode": "M"
      },
      "startTime": "2025-12-01T09:00:00Z",
      "endTime": "2025-12-01T17:00:00Z",
      "breakMinutes": 30,
      "status": "scheduled",
      "isPublished": true,
      "notes": "Busy day expected",
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 156
  }
}
```

### Get Shift

```http
GET /v1/shifts/:id
```

### Create Shift

```http
POST /v1/shifts
```

**Request Body:**
```json
{
  "scheduleId": "uuid",
  "locationId": "uuid",
  "employeeId": "uuid",
  "positionId": "uuid",
  "shiftTypeId": "uuid",
  "startTime": "2025-12-01T09:00:00Z",
  "endTime": "2025-12-01T17:00:00Z",
  "breakMinutes": 30,
  "notes": "Opening shift"
}
```

**Response:** Created shift (201)

**Errors:**
- `400` - Validation error (e.g., end time before start time)
- `409` - Shift conflict (employee already scheduled)

### Update Shift

```http
PATCH /v1/shifts/:id
```

### Delete Shift

```http
DELETE /v1/shifts/:id
```

### Bulk Create Shifts

```http
POST /v1/shifts/bulk
```

**Request Body:**
```json
{
  "shifts": [
    {
      "locationId": "uuid",
      "employeeId": "uuid",
      "startTime": "2025-12-01T09:00:00Z",
      "endTime": "2025-12-01T17:00:00Z"
    },
    // ... more shifts
  ]
}
```

**Response:**
```json
{
  "created": 10,
  "failed": 2,
  "errors": [
    {
      "index": 3,
      "error": "Shift conflict"
    }
  ]
}
```

### Publish Shifts

```http
POST /v1/shifts/publish
```

**Request Body:**
```json
{
  "shiftIds": ["uuid1", "uuid2"],
  "sendNotifications": true
}
```

---

## 📋 Schedules

### List Schedules

```http
GET /v1/schedules?locationId=uuid&status=published
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "locationId": "uuid",
      "name": "Week 48 - 2025",
      "startDate": "2025-12-01",
      "endDate": "2025-12-07",
      "status": "published",
      "isTemplate": false,
      "publishedAt": "2025-11-25T10:00:00Z",
      "shiftsCount": 45,
      "createdAt": "2025-11-20T00:00:00Z"
    }
  ]
}
```

### Create Schedule

```http
POST /v1/schedules
```

**Request Body:**
```json
{
  "locationId": "uuid",
  "name": "Week 49 - 2025",
  "startDate": "2025-12-08",
  "endDate": "2025-12-14"
}
```

### Copy Schedule

```http
POST /v1/schedules/:id/copy
```

**Request Body:**
```json
{
  "startDate": "2025-12-15",
  "endDate": "2025-12-21",
  "copyAssignments": true
}
```

---

## ⏰ Time Tracking

### Clock In

```http
POST /v1/time-entries/clock-in
```

**Request Body:**
```json
{
  "shiftId": "uuid",
  "locationId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "photoUrl": "https://..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "shiftId": "uuid",
  "clockInTime": "2025-12-01T09:02:00Z",
  "clockInLatitude": 40.7128,
  "clockInLongitude": -74.0060
}
```

### Clock Out

```http
POST /v1/time-entries/clock-out
```

**Request Body:**
```json
{
  "timeEntryId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "photoUrl": "https://...",
  "breakMinutes": 30
}
```

### List Time Entries

```http
GET /v1/time-entries?employeeId=uuid&startDate=2025-12-01&endDate=2025-12-31
```

### Approve Time Entry

```http
POST /v1/time-entries/:id/approve
```

**Requires:** Manager role

---

## 🏖️ Leave Requests

### List Leave Requests

```http
GET /v1/leave-requests?employeeId=uuid&status=pending&startDate=2025-12-01
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employee": {
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "leaveType": "vacation",
      "startDate": "2025-12-20",
      "endDate": "2025-12-24",
      "totalDays": 3,
      "status": "pending",
      "reason": "Family vacation",
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ]
}
```

### Create Leave Request

```http
POST /v1/leave-requests
```

**Request Body:**
```json
{
  "leaveType": "vacation",
  "startDate": "2025-12-20",
  "endDate": "2025-12-24",
  "reason": "Family vacation"
}
```

### Approve/Reject Leave Request

```http
POST /v1/leave-requests/:id/review
```

**Request Body:**
```json
{
  "status": "approved",
  "reviewNotes": "Approved. Have a great vacation!"
}
```

**Requires:** Manager role

---

## 🔄 Shift Swaps

### List Shift Swap Requests

```http
GET /v1/shift-swaps?status=pending
```

### Request Shift Swap

```http
POST /v1/shift-swaps
```

**Request Body:**
```json
{
  "originalShiftId": "uuid",
  "requestedWith": "uuid",
  "offeredShiftId": "uuid",
  "reason": "Need to attend appointment"
}
```

### Accept Shift Swap

```http
POST /v1/shift-swaps/:id/accept
```

### Approve Shift Swap

```http
POST /v1/shift-swaps/:id/approve
```

**Requires:** Manager role

---

## 🔔 Notifications

### List Notifications

```http
GET /v1/notifications?isRead=false&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "shift_assigned",
      "title": "New Shift Assigned",
      "body": "You have been assigned to work on Dec 1, 2025 from 9:00 AM to 5:00 PM",
      "actionUrl": "/shifts/uuid",
      "isRead": false,
      "createdAt": "2025-11-28T10:00:00Z"
    }
  ],
  "meta": {
    "unreadCount": 5
  }
}
```

### Mark as Read

```http
POST /v1/notifications/:id/read
```

### Mark All as Read

```http
POST /v1/notifications/read-all
```

---

## 💬 Messages

### List Conversations

```http
GET /v1/messages/conversations
```

**Response:**
```json
{
  "data": [
    {
      "threadId": "uuid",
      "lastMessage": {
        "id": "uuid",
        "subject": "Schedule Question",
        "body": "Can you work on Friday?",
        "senderId": "uuid",
        "sender": {
          "firstName": "Manager",
          "lastName": "Name"
        },
        "createdAt": "2025-11-28T14:30:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

### List Messages

```http
GET /v1/messages?threadId=uuid
```

### Send Message

```http
POST /v1/messages
```

**Request Body:**
```json
{
  "recipientId": "uuid",
  "subject": "Schedule Question",
  "body": "I can work on Friday!",
  "threadId": "uuid"
}
```

---

## 📄 Documents

### List Documents

```http
GET /v1/documents?employeeId=uuid&type=contract
```

### Upload Document

```http
POST /v1/documents/upload
```

**Request Body:** `multipart/form-data`

```
file: [binary]
employeeId: uuid
type: contract
name: Employment Contract
description: Full-time employment contract
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Employment Contract",
  "type": "contract",
  "storageUrl": "https://...",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "createdAt": "2025-11-28T10:00:00Z"
}
```

### Download Document

```http
GET /v1/documents/:id/download
```

**Response:** Signed URL for download

```json
{
  "url": "https://r2.../file.pdf?signature=...",
  "expiresAt": "2025-11-28T11:00:00Z"
}
```

---

## 📊 Reports

### Generate Report

```http
POST /v1/reports/generate
```

**Request Body:**
```json
{
  "type": "payroll",
  "parameters": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "locationId": "uuid"
  },
  "format": "xlsx"
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "payroll",
  "status": "pending",
  "createdAt": "2025-11-28T10:00:00Z"
}
```

### Get Report Status

```http
GET /v1/reports/:id
```

**Response:**
```json
{
  "id": "uuid",
  "type": "payroll",
  "status": "completed",
  "fileUrl": "https://...",
  "fileFormat": "xlsx",
  "completedAt": "2025-11-28T10:05:00Z"
}
```

### Report Types

- `payroll` - Payroll report
- `attendance` - Attendance report
- `labor_cost` - Labor cost analysis
- `schedule` - Schedule overview
- `time_entries` - Time tracking report

---

## ❌ Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "startTime",
        "message": "Start time must be in the future"
      }
    ]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., shift conflict)
- `422` - Unprocessable Entity
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## ⏱️ Rate Limiting

### Limits

- **Authenticated Requests:** 100 requests/minute per user
- **Admin Requests:** 1000 requests/minute
- **Webhook Endpoints:** 10 requests/minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

### Handling Rate Limits

```typescript
async function apiRequest(url: string) {
  const response = await fetch(url);

  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const waitTime = (parseInt(resetTime) * 1000) - Date.now();

    await new Promise(resolve => setTimeout(resolve, waitTime));
    return apiRequest(url); // Retry
  }

  return response.json();
}
```

---

## 🔗 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## 🔍 Filtering & Sorting

### Filtering

Use query parameters:
```http
GET /v1/employees?locationId=uuid&isActive=true&search=john
```

### Sorting

```http
GET /v1/shifts?sort=startTime&order=asc
```

Options:
- `order`: `asc` or `desc`
- `sort`: Field name

---

## 📱 Webhooks

### Configure Webhooks

```http
POST /v1/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhooks/planday",
  "events": ["shift.created", "shift.updated", "leave_request.approved"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `shift.created`
- `shift.updated`
- `shift.deleted`
- `shift.published`
- `time_entry.created`
- `leave_request.created`
- `leave_request.approved`
- `leave_request.rejected`

### Webhook Payload

```json
{
  "event": "shift.created",
  "timestamp": "2025-11-28T10:00:00Z",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "startTime": "2025-12-01T09:00:00Z",
    "endTime": "2025-12-01T17:00:00Z"
  }
}
```

---

## 🧪 Testing

### Postman Collection

Download our Postman collection: [planday-api.postman_collection.json](./postman/planday-api.postman_collection.json)

### cURL Examples

```bash
# Get shifts
curl -X GET "https://api.yourdomain.com/v1/shifts?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create shift
curl -X POST "https://api.yourdomain.com/v1/shifts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "uuid",
    "employeeId": "uuid",
    "startTime": "2025-12-01T09:00:00Z",
    "endTime": "2025-12-01T17:00:00Z"
  }'
```

---

## 📚 SDKs

### TypeScript/JavaScript

```typescript
import { PlandayAPI } from '@planday/api-client';

const client = new PlandayAPI({
  baseUrl: 'https://api.yourdomain.com/v1',
  getToken: async () => await clerk.session.getToken(),
});

// List shifts
const shifts = await client.shifts.list({
  startDate: '2025-12-01',
  endDate: '2025-12-31',
});

// Create shift
const shift = await client.shifts.create({
  locationId: 'uuid',
  employeeId: 'uuid',
  startTime: '2025-12-01T09:00:00Z',
  endTime: '2025-12-01T17:00:00Z',
});
```

---

## 🔄 Versioning

API version is specified in the URL: `/v1/`

Breaking changes will result in a new version: `/v2/`

---

**API Version:** 1.0
**Last Updated:** November 2025
**Support:** api-support@yourdomain.com
