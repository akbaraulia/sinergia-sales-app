# Report Scheduler - Cronjob Setup Guide

## Overview
Sistem otomatis untuk mengirim laporan replenishment via email setiap hari/minggu/bulan menggunakan cronjob trigger.

## Architecture

### Flow
1. **Cronjob.org** trigger endpoint dengan API key/secret
2. **Backend** fetch 3 reports (30 hari terakhir):
   - Replenishment (ERP)
   - Replenishment SIVFU
   - Replenishment Combined
3. **Generate** 3 CSV files
4. **Fetch recipients**: Get employee IDs from SQLite → Get emails from ERP
5. **Send email** ke semua recipients dengan CSV attachments
6. **Log** execution details ke ERP Report Scheduler

### Security Architecture
- **Recipients**: Stored in local SQLite (`data/recipients.db`)
  - Only `employee_id`, `name`, and `designation` stored
  - **Emails NOT stored** - fetched from ERP in real-time
  - Safe to push to GitHub (`.gitignore` excludes database files)
- **Email Fetching**: During send, system calls ERP `get_employee_user` to get current emails
- **Benefits**: Email changes in ERP automatically reflected, no sensitive data in repo

---

## API Endpoints

### 1. Cronjob Trigger (Main Endpoint)
**POST** `/api/reports/scheduler/trigger`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "api_key": "your_erp_api_key",
  "api_secret": "your_erp_api_secret",
  "branch_filter": "JKT" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reports generated and sent successfully",
  "data": {
    "date_range": {
      "start": "2025-11-11",
      "end": "2025-12-11"
    },
    "reports_generated": {
      "replenishment": { "data_count": 1500, "csv_generated": true },
      "replenishment_sivfu": { "data_count": 850, "csv_generated": true },
      "replenishment_combined": { "data_count": 750, "csv_generated": true }
    },
    "csv_files": [
      { "filename": "replenishment_2025-11-11_to_2025-12-11.csv", "size_kb": 256.5, "rows": 1500 },
      { "filename": "replenishment_sivfu_2025-11-11_to_2025-12-11.csv", "size_kb": 180.2, "rows": 850 },
      { "filename": "replenishment_combined_2025-11-11_to_2025-12-11.csv", "size_kb": 145.8, "rows": 750 }
    ],
    "email": {
      "sent": true,
      "recipients": ["manager@sinergia.com", "analyst@sinergia.com"],
      "message_id": "<abc123@mail.server>"
    },
    "erp_log": {
      "posted": true,
      "log_id": "REP-SCHED-2025-0001"
    },
    "execution": {
      "started_at": "2025-12-11T10:00:00Z",
      "completed_at": "2025-12-11T10:02:35Z",
      "processing_time_ms": 155000
    }
  }
}
```

---

### 2. Recipients Management

#### Get All Recipients
**GET** `/api/settings/report-recipients`

**Headers:** Cookie-based (user session)

**Response:**
```json
{
  "success": true,
  "data": [
    { "employee": "EMP-001", "email": "manager@sinergia.com" },
    { "email": "analyst@sinergia.com" }
  ]
}
```

#### Add Recipient
**POST** `/api/settings/report-recipients`

**Headers:** Cookie-based (user session)

**Body:**
```json
{
  "employee": "EMP-001", // optional
  "email": "newrecipient@sinergia.com"
}
```

#### Remove Recipient
**DELETE** `/api/settings/report-recipients?email=recipient@sinergia.com`

**Headers:** Cookie-based (user session)

---

## Environment Variables

Add these to your `.env` or `.env.local`:

```bash
# SMTP Configuration (for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Sinergia Reports <noreply@sinergia.com>"

# ERP Configuration (already exists)
ERP_BASE_URL=https://erp.sinergia.com
ERP_API_KEY=your_api_key
ERP_API_SECRET=your_api_secret
```

### Gmail SMTP Setup
1. Enable 2-factor authentication di Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password sebagai `SMTP_PASSWORD`

---

## Cronjob.org Setup

### 1. Create Account
- Sign up di https://cronjob.org
- Verify email

### 2. Create New Cronjob
- **URL:** `https://your-domain.com/api/reports/scheduler/trigger`
- **Schedule:** 
  - Daily: `0 8 * * *` (every day at 8 AM)
  - Weekly: `0 8 * * 1` (every Monday at 8 AM)
  - Monthly: `0 8 1 * *` (1st day of month at 8 AM)
- **Method:** POST
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "api_key": "your_erp_api_key",
    "api_secret": "your_erp_api_secret"
  }
  ```
- **Timezone:** Asia/Jakarta (UTC+7)

### 3. Test Execution
- Click "Run now" untuk test
- Check response status (should be 200 OK)
- Verify email received

---

## Admin Page

Access: `/settings/report-recipients`

Features:
- ✅ View all recipients
- ✅ Add new recipient (email + optional employee ID)
- ✅ Remove recipient
- ✅ Refresh list
- ✅ Email validation

**Note:** Admin page uses cookie-based authentication (user must be logged in).

---

## Email Template

Email yang dikirim menggunakan template HTML dengan:
- **Header:** Gradient green (Sinergia branding)
- **Date Range:** Periode data (30 hari)
- **Report Cards:** 3 cards untuk setiap report
  - Icon status (✅ generated / ⚠️ not generated)
  - Filename
  - File size (KB)
  - Row count
- **Attachments:** 3 CSV files

---

## CSV Files

### 1. Replenishment (ERP)
- **Format:** Dynamic warehouse columns
- **Columns per warehouse:** 12 (Total Stock, Sales M0-M3, Min, Max, ROP, Replan, etc.)
- **Sorting:** Branch + Warehouse name

### 2. Replenishment SIVFU
- **Format:** Fixed 35 branches
- **Columns per branch:** 12 (same as ERP)
- **Buffer:** Dynamic based on branch (1/2/4 months)

### 3. Replenishment Combined
- **Format:** SIVFU vs ERP comparison
- **Columns:** SIVFU Replan, ERP Replan, Delta, Delta %, Discrepancy Level
- **Sorting:** Descending by absolute delta

---

## ERP Logging

Setiap execution (success/failed) akan dicatat ke ERP:

**Doctype:** Report Scheduler

**Fields:**
- `report_type`: "Replenishment"
- `url`: API endpoint
- `execute_time`: Timestamp
- `status`: "Aktif" (success) / "Non-Aktif" (failed)
- `response`: JSON dengan detail execution:
  - Date range
  - Reports generated count
  - CSV files (size, rows)
  - Email sent status
  - Recipients count
  - Processing time (ms)
  - Error message (if failed)

---

## Testing

### Manual Test (Local)
```bash
# Test cronjob trigger endpoint
curl -X POST http://localhost:3000/api/reports/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your_api_key",
    "api_secret": "your_api_secret"
  }'
```

### Test Recipients API
```bash
# Get recipients
curl http://localhost:3000/api/settings/report-recipients \
  -H "Cookie: sid=your_session_cookie"

# Add recipient
curl -X POST http://localhost:3000/api/settings/report-recipients \
  -H "Content-Type: application/json" \
  -H "Cookie: sid=your_session_cookie" \
  -d '{"email": "test@example.com"}'

# Remove recipient
curl -X DELETE "http://localhost:3000/api/settings/report-recipients?email=test@example.com" \
  -H "Cookie: sid=your_session_cookie"
```

---

## Troubleshooting

### Email Not Sent
- Check SMTP credentials in `.env`
- Test SMTP connection manually
- Check firewall/port 587 access
- Verify Gmail App Password (if using Gmail)

### No Recipients
- Check ERP Report Scheduler doctype exists
- Add recipients via admin page: `/settings/report-recipients`
- Verify recipients saved in ERP

### 401 Unauthorized
- Verify API key/secret in cronjob body
- Check ERP_API_KEY and ERP_API_SECRET in `.env`
- Ensure credentials match

### Empty CSV
- Check date range (last 30 days)
- Verify ERP reports return data
- Check branch filter (if used)

### ERP Logging Failed
- Check ERP connection
- Verify Report Scheduler doctype exists in ERP
- Check ERP API permissions

---

## File Structure

```
src/
├── types/
│   └── report-scheduler.ts          # Types untuk scheduler system
├── lib/
│   ├── reports/
│   │   └── csv-generator.ts         # CSV generation logic
│   ├── email/
│   │   ├── templates.ts             # Email HTML/text templates
│   │   └── sender.ts                # Nodemailer integration
│   └── erp/
│       └── report-logger.ts         # ERP logging functions
├── app/
│   ├── api/
│   │   ├── settings/
│   │   │   └── report-recipients/
│   │   │       └── route.ts         # Recipients CRUD API
│   │   └── reports/
│   │       └── scheduler/
│   │           └── trigger/
│   │               └── route.ts     # Main cronjob trigger
│   └── (dashboard)/
│       └── settings/
│           └── report-recipients/
│               └── page.tsx         # Admin page
```

---

## Security

- ✅ API key/secret authentication untuk cronjob
- ✅ Cookie-based authentication untuk admin page
- ✅ No public endpoints
- ✅ Email validation
- ✅ Error logging (no sensitive data exposed)

---

## Next Steps

1. **Configure SMTP** credentials in `.env`
2. **Add recipients** via admin page
3. **Setup cronjob** di cronjob.org
4. **Test manually** untuk verify
5. **Monitor logs** di ERP Report Scheduler

---

## Support

For issues or questions:
- Check ERP logs: Report Scheduler doctype
- Check application logs: Console/terminal
- Verify environment variables
- Test email delivery manually

---

**Created:** December 11, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
