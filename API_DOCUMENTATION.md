# Pay4it Payroll API Documentation

## Base URL
```
https://api.pay4it.com/api/v1
```

## Authentication
All API endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling
All endpoints return errors in this format:
```json
{
  "message": "Error message here",
  "error": "Detailed error information"
}
```

## Payroll Management

### 1. Schedule a Payroll
```http
POST /payroll/schedule
```

**Request Body:**
```json
{
  "name": "January 2025 Payroll",
  "frequency": "monthly", // "monthly", "bi-weekly"
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "is_recurring": true
}
```

**Response:**
```json
{
  "message": "Payroll scheduled successfully",
  "data": {
    "_id": "payroll_id",
    "name": "January 2025 Payroll",
    "status": "draft",
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-01-31"
    },
    "frequency": "monthly",
    "total_employees": 50,
    "payslips": []
  }
}
```

### 2. Get Payroll List
```http
GET /payroll
```

**Query Parameters:**
- `status`: Filter by status (draft, pending, processing, completed, failed)
- `frequency`: Filter by frequency (monthly, bi-weekly)
- `start_date`: Filter by period start date
- `end_date`: Filter by period end date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort_by`: Field to sort by (default: period.start_date)
- `sort_order`: Sort order (asc, desc)

**Response:**
```json
{
  "message": "Payrolls retrieved successfully",
  "data": {
    "payrolls": [{
      "_id": "payroll_id",
      "name": "January 2025 Payroll",
      "status": "completed",
      "period": {
        "start_date": "2025-01-01",
        "end_date": "2025-01-31"
      },
      "frequency": "monthly",
      "total_employees": 50,
      "summary": {
        "total_gross": 25000000,
        "total_deductions": 2500000,
        "total_allowances": 1000000,
        "total_net": 23500000
      }
    }],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "total_pages": 5,
      "has_next_page": true,
      "has_prev_page": false
    }
  }
}
```

### 3. Process Payroll
```http
POST /payroll/process/:payrollId
```

**Response:**
```json
{
  "message": "Payroll processing started",
  "data": {
    "status": "processing",
    "processing_id": "process_id"
  }
}
```

## Deductions Management

### 1. Create Deduction
```http
POST /deductions
```

**Request Body:**
```json
{
  "name": "Late Arrival Fee",
  "description": "Deduction for arriving late",
  "amount": 1000,
  "type": "fixed", // "fixed" or "percentage"
  "frequency": "one-time" // "one-time" or "recurring"
}
```

### 2. Apply Deduction
```http
POST /deductions/:deduction_id/apply
```

**Request Body:**
```json
{
  "target_type": "employee", // "employee" or "department"
  "target_id": "employee_or_department_id",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31" // optional
}
```

### 3. Get Deductions
```http
GET /deductions
```

**Query Parameters:**
- `status`: Filter by status (active, inactive)
- `target_type`: Filter by target type (employee, department)
- `target_id`: Filter by specific employee or department

**Response:**
```json
{
  "message": "Deductions retrieved successfully",
  "data": [{
    "_id": "deduction_id",
    "name": "Late Arrival Fee",
    "amount": 1000,
    "type": "fixed",
    "frequency": "one-time",
    "applications": [{
      "target_type": "employee",
      "target_id": {
        "_id": "employee_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "status": "active"
    }]
  }]
}
```

## Extra Earnings Management

### 1. Create Extra Earning
```http
POST /extra-earnings
```

**Request Body:**
```json
{
  "name": "Performance Bonus",
  "description": "Bonus for exceptional performance",
  "amount": 50000,
  "type": "fixed", // "fixed" or "percentage"
  "frequency": "one-time" // "one-time" or "recurring"
}
```

### 2. Apply Extra Earning
```http
POST /extra-earnings/:earning_id/apply
```

**Request Body:**
```json
{
  "target_type": "department", // "employee" or "department"
  "target_id": "department_id",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31" // optional
}
```

### 3. Get Extra Earnings
```http
GET /extra-earnings
```

**Query Parameters:**
Same as deductions

## Payslip Details

When a payroll is processed, each employee's payslip includes:

```json
{
  "employee": {
    "_id": "employee_id",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "position": "Software Engineer"
  },
  "base_salary": 500000,
  "allowances": [
    {
      "type": "transport",
      "amount": 30000,
      "description": "Transport Allowance"
    },
    {
      "type": "housing",
      "amount": 50000,
      "description": "Housing Allowance"
    }
  ],
  "deductions": [
    {
      "type": "tax",
      "amount": 45000,
      "description": "PAYE Tax"
    },
    {
      "type": "pension",
      "amount": 40000,
      "description": "Pension Contribution"
    }
  ],
  "extra_earnings": [
    {
      "type": "overtime",
      "amount": 25000,
      "description": "Overtime Pay"
    }
  ],
  "gross_pay": 605000,
  "net_pay": 520000,
  "status": "completed"
}
```

## Webhook Notifications

The API will send webhook notifications for the following events:

1. Payroll Status Changes
```json
{
  "event": "payroll.status_changed",
  "payroll_id": "payroll_id",
  "old_status": "processing",
  "new_status": "completed",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

2. Deduction/Extra Earning Applications
```json
{
  "event": "deduction.applied",
  "deduction_id": "deduction_id",
  "target_type": "employee",
  "target_id": "employee_id",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

## Rate Limits
- 1000 requests per minute per IP
- 10,000 requests per day per API key

## Best Practices
1. Always handle pagination for list endpoints
2. Implement retry logic for webhook notifications
3. Cache frequently accessed data (e.g., payroll summaries)
4. Use appropriate error handling for all API calls
5. Implement proper loading states for processing payrolls
