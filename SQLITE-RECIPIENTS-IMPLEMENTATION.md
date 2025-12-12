# SQLite Recipients Implementation Summary

## Changes Made

### 1. Email Configuration ✅
Updated environment variable names from `SMTP_*` to `MAIL_*`:
- `MAIL_HOST=mail.sinergia.co.id`
- `MAIL_PORT=26`
- `MAIL_USERNAME=noreply@sinergia.co.id`
- `MAIL_PASSWORD=sinergia.123@@`
- `MAIL_ENCRYPTION=` (empty = no encryption, use `ssl` for SSL)
- `MAIL_FROM_ADDRESS="noreply@sinergia.co.id"`
- `MAIL_FROM_NAME="Sinergia ERP APPS"`

### 2. SQLite Database ✅
Created local database for recipient storage:
- **Location**: `data/recipients.db`
- **Schema**: `id`, `employee_id`, `employee_name`, `designation`, `created_at`
- **Security**: Emails NOT stored - only employee IDs and names
- **Git-safe**: Database files excluded from version control

### 3. API Routes Updated ✅

#### GET `/api/settings/report-recipients`
- **Old**: Fetched from ERP Report Scheduler doctype
- **New**: Fetches from SQLite database
- Returns: List of recipients (NO emails, just employee info)

#### POST `/api/settings/report-recipients`
- **Old**: Added to ERP Report Scheduler doctype
- **New**: Adds to SQLite database
- Body: `{ employee_id, employee_name, designation }`

#### DELETE `/api/settings/report-recipients?employee_id=XXX`
- **Old**: Removed from ERP Report Scheduler doctype
- **New**: Removes from SQLite database

### 4. Admin Page Updated ✅
- **Employee Dropdown**: Fetches from ERP `get_employee_user` for selection
- **Recipient List**: Shows stored recipients from SQLite (no email column)
- **Table Columns**: Employee ID, Name, Designation, Added Date
- **Preview Card**: Shows full employee details when selecting

### 5. Email Sending (Cronjob) Updated ✅
- **Old**: Fetched emails from ERP Report Scheduler
- **New**: 
  1. Get employee IDs from SQLite
  2. Call ERP `get_employee_user` to fetch current emails
  3. Map employee IDs to emails
  4. Send to mapped email addresses
- **Benefit**: Always uses latest email from ERP

### 6. Security Benefits ✅
- ✅ No email addresses in database files
- ✅ No email addresses in source code
- ✅ Safe to push to GitHub
- ✅ Email changes in ERP automatically reflected
- ✅ Minimal sensitive data exposure

---

## How It Works

### Adding Recipients (Admin UI)
1. Admin opens Settings → Report Recipients
2. Clicks "Add Recipient"
3. Selects employee from dropdown (loaded from ERP)
4. Preview shows: ID, Name, Email, Designation, Department
5. Clicks "Add Recipient"
6. **SQLite stores**: `employee_id`, `employee_name`, `designation` (NO email!)

### Sending Reports (Cronjob)
1. Cronjob triggers `/api/reports/scheduler/trigger`
2. System fetches recipients from SQLite → Gets employee IDs
3. System calls ERP `get_employee_user` → Gets ALL employees with emails
4. System maps employee IDs to current emails
5. System sends emails to mapped addresses
6. **Result**: Always sends to latest email from ERP

---

## Files Changed

1. **src/lib/db/sqlite.ts** (NEW) - SQLite database helper
2. **src/app/api/settings/report-recipients/route.ts** - Updated CRUD to use SQLite
3. **src/app/(dashboard)/settings/report-recipients/page.tsx** - Updated admin UI
4. **src/lib/email/sender.ts** - Updated SMTP env variables
5. **src/app/api/reports/scheduler/trigger/route.ts** - Updated recipient fetching
6. **next.config.ts** - Added NEXT_PUBLIC_ERP_BASE_URL
7. **.gitignore** - Excluded `data/` and `.db` files
8. **data/README.md** (NEW) - Database documentation
9. **CRONJOB-SETUP.md** - Updated architecture docs

---

## Testing Steps

### 1. Test Recipients Page
```powershell
# Start dev server
npm run dev

# Open browser
http://localhost:3000/settings/report-recipients
```

**Expected**:
- ✅ Page loads without redirect
- ✅ Employee dropdown populates from ERP
- ✅ Can add recipient (saves to SQLite)
- ✅ Table shows: Employee ID, Name, Designation, Added Date
- ✅ No email column visible (security!)
- ✅ Can remove recipient

### 2. Test Email Sending (Manual)
```powershell
# Test cronjob endpoint
$body = @{
    api_key = "your_api_key"
    api_secret = "your_api_secret"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/reports/scheduler/trigger" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected**:
- ✅ Fetches recipients from SQLite
- ✅ Fetches emails from ERP `get_employee_user`
- ✅ Maps employee IDs to emails
- ✅ Sends emails with 3 CSV attachments
- ✅ Logs execution to ERP

### 3. Verify SQLite Database
```powershell
# Install SQLite browser (optional)
# Or use PowerShell to query

# Check recipients exist
Get-Content "data/recipients.db" # Binary file, use SQLite browser to view

# Better: Use SQLite CLI
sqlite3 data/recipients.db "SELECT * FROM recipients"
```

---

## Environment Variables Required

Add to `.env.local`:

```bash
# ERP Configuration
ERP_BASE_URL=https://your-erp.com
ERP_API_KEY=your_api_key
ERP_API_SECRET=your_api_secret

# Email Configuration (UPDATED NAMES!)
MAIL_HOST=mail.sinergia.co.id
MAIL_PORT=26
MAIL_USERNAME=noreply@sinergia.co.id
MAIL_PASSWORD=sinergia.123@@
MAIL_ENCRYPTION=
MAIL_FROM_ADDRESS="noreply@sinergia.co.id"
MAIL_FROM_NAME="Sinergia ERP APPS"
```

---

## Migration Notes

### If you had old recipients in ERP
The old ERP Report Scheduler recipients are **NOT automatically migrated**. You need to:
1. Open Settings → Report Recipients
2. Add each employee again from the dropdown
3. They will be saved to SQLite

### Multi-server deployment
If deploying to multiple servers:
- Each server has its own `data/recipients.db`
- Consider using shared storage (NFS, S3) for `data/` folder
- Or sync database files manually
- Or use a shared database (PostgreSQL, MySQL) instead of SQLite

---

## Troubleshooting

### "Failed to load employee list"
- Check `NEXT_PUBLIC_ERP_BASE_URL` is set in next.config.ts
- Check ERP endpoint `/api/method/get_employee_user` is accessible
- Check browser cookies (needs authentication)

### "Database locked"
- SQLite is in WAL mode for better concurrency
- If persists, restart application

### Emails not sending
1. Check SMTP config in `.env.local`
2. Test SMTP connection manually
3. Check recipients exist in SQLite: `SELECT * FROM recipients`
4. Check cronjob logs for mapping errors

### Recipients list empty after server restart
- SQLite file should persist in `data/recipients.db`
- Check file permissions
- Check `.gitignore` hasn't deleted it

---

## Next Steps

1. ✅ Email config already set by user
2. ⏳ Test recipients page loading
3. ⏳ Add test recipients
4. ⏳ Test manual email send
5. ⏳ Setup cronjob.org trigger
6. ⏳ Monitor first automated run

---

## Questions?

- **Q: Why not store emails directly?**
  - A: Security! If GitHub repo is leaked, no email addresses exposed.

- **Q: What if employee email changes in ERP?**
  - A: Perfect! System fetches latest email during send. No manual update needed.

- **Q: Can I export recipient list?**
  - A: Yes, query SQLite directly or add export endpoint (TODO).

- **Q: What happens if employee removed from ERP?**
  - A: They stay in SQLite but won't receive emails (email fetch returns null).

- **Q: Is SQLite production-ready?**
  - A: Yes for recipient storage (low write, high read). For heavy workloads, consider PostgreSQL.
