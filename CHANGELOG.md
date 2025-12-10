# 📋 Changelog - Sinergia Sales Web App

## 🚀 Recent Updates (December 2025)

### ✨ Major Features Added (Recent Work)

#### 1. **SIVFU Replenishment Report with Per-Branch Avg Flow** 
**Files Changed:** 
- `src/query/replan-sivfu.sql` (Modified - added 35 Avg_Flow calculations)
- `src/app/api/reports/replenishment-sivfu/route.ts` (Modified - removed backend calc)
- `src/app/reports/replenishment-sivfu/page.tsx` (Existing)

**The Problem:**
- Console error: `JKT Avg Flow for 1010202015: NaN (S: 38.0000+112.0000+22.0000, L: 6+78+164)`
- Backend calculation failed because MySQL DECIMAL columns returned as **strings** ("38.0000" not 38)
- JavaScript string arithmetic: `"38.0000" + "112.0000" = NaN` 💀

**The Solution:**
- ✅ Added **Avg Flow calculation for ALL 35 branches** directly in SQL query
- ✅ MySQL handles DECIMAL types natively - no string issues
- ✅ Formula: `ROUND((S_M1 + S_M2 + S_M3 + L_M1 + L_M2 + L_M3) / 3, 1)`
- ✅ Removed failed backend calculation logic (lines 42-77 deleted)
- ✅ All 35 branches now show proper decimal values (e.g., 140.0 instead of NaN)

**Technical Details:**
```sql
-- Example for JKT branch
ROUND((
  SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m1 ELSE 0 END) + 
  SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m2 ELSE 0 END) + 
  SUM(CASE WHEN fd.branch_id='JKT' THEN fd.s_m3 ELSE 0 END) + 
  SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m1 ELSE 0 END) + 
  SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m2 ELSE 0 END) + 
  SUM(CASE WHEN fd.branch_id='JKT' THEN fd.l_m3 ELSE 0 END)
) / 3, 1) AS JKT_Avg_Flow
```

**How to Use:**
1. Navigate to **Reports → SIVFU Replenishment** (`/reports/replenishment-sivfu`)
2. Query executes automatically (~70-75 seconds for 653 items)
3. Scroll horizontally through all 35 branch columns
4. Each branch shows 12 columns:
   - **Stock** - Current inventory
   - **Replenish** - Suggested replenishment quantity
   - **DOI** - Days of Inventory
   - **S_M0, S_M1, S_M2, S_M3** - Sales for current month and last 3 months
   - **L_M0, L_M1, L_M2, L_M3** - Material issues (lain-lain) for current and last 3 months
   - **Avg_Flow** ⭐ - Average monthly flow (new!)
5. Click **Export CSV** to download with all Avg Flow columns included

**35 Branches Covered:**
JKT, SBY, SMG, MDN, HO, MKS, BJM, PKU, DPS, PLG, YGY, MND, KPG, PDG, PDG1, SMR1, DP1, MDN1, AMB, HO2, PKU1, JMB1, BKP, PLU1, AMB1, PLG1, MKS1, BJM1, MKP, PHL, PTK1, MKPS, MKPM, MKPN, LPG1

**Performance:**
- Query time: ~70-75 seconds
- Total columns: 446 (3 fixed + 1 national section × 12 + 35 branches × 12 + 35 Avg_Flow)
- Rows: 653 items

---

#### 2. **Voucher "Bebas Pilih" - 25K Tolerance Fix**
**Files Changed:**
- `src/app/voucher/[promoCode]/page.tsx` (Modified - 2 key calculations fixed)

**The Problem:**
User complaint:
```
Total Selected: Rp 3.467.000
Remaining: Rp 33.000

Kenapa gak bisa add barang Rp 35.000?
Padahal cuma lebih Rp 2.000, tapi container barangnya:
"EXCEED VOUCHER VALUE" ❌
```

Old validation was **too strict**: `remainingVoucherValue >= item.price`

**The Solution:**
- ✅ Added **Rp 25.000 tolerance** above voucher value
- ✅ Updated `maxQuantity` calculation: `Math.floor((voucher + 25k - cartTotal) / itemPrice)`
- ✅ Updated `canAdd` validation: `remainingWithTolerance >= item.price`
- ✅ Changed button text: "Exceeds voucher value" → "Exceeds limit (+25k)"

**Technical Details:**
```typescript
// Before (STRICT)
const maxQuantity = Math.floor(remainingVoucherValue / item.price)
const canAdd = remainingVoucherValue >= item.price && ...

// After (WITH TOLERANCE)
const UPPER_TOLERANCE = 25000
const maxAllowedTotal = (promo?.nilai || 0) + UPPER_TOLERANCE
const remainingWithTolerance = maxAllowedTotal - cartTotal
const maxQuantity = Math.floor(remainingWithTolerance / item.price)
const canAdd = remainingWithTolerance >= item.price && ...
```

**How to Use:**
1. Navigate to **Voucher → [Promo Code]** (e.g., `/voucher/PROMO123`)
2. Fill **required fields**:
   - Voucher Type (e.g., "Bebas Pilih")
   - Branch (e.g., "JKT")
   - Sales Person
   - Customer
3. Browse available items and add to cart
4. **Example Scenario:**
   - Voucher value: **Rp 3.500.000**
   - Max allowed: **Rp 3.525.000** (voucher + 25k tolerance)
   - Current cart: Rp 3.467.000
   - Remaining: Rp 33.000 (before) / Rp 58.000 (with tolerance)
   - Item price: Rp 35.000
   - **Result:** ✅ Can add! (35k < 58k remaining with tolerance)
5. Submit order when ready

**Before vs After:**
| Scenario | Before | After |
|----------|--------|-------|
| Remaining Rp 33k, Item Rp 35k | ❌ Blocked | ✅ Allowed (+2k = within 25k) |
| Remaining Rp 10k, Item Rp 40k | ❌ Blocked | ✅ Allowed (+30k = exceeds) |
| Remaining Rp 5k, Item Rp 100k | ❌ Blocked | ❌ Still blocked (+95k > 25k) |

**Business Logic:**
- Lower limit: **Must be at least Rp 20.000** below voucher (prevents tiny orders)
- Upper limit: **Can exceed by max Rp 25.000** (tolerance for practical reasons)
- Sweet spot: **Within Rp 25.000 of voucher value** (ideal range)

---

#### 3. **Combined Replenishment Report (SIVFU + ERP)**
**Files Changed:**
- `src/app/api/reports/replenishment-combined/route.ts` ✨ NEW
- `src/app/reports/replenishment-combined/page.tsx` ✨ NEW
- `src/lib/constants/branch-mapping.ts` ✨ NEW
- `src/types/combined-replenishment.ts` ✨ NEW

**The Problem:**
- SIVFU (internal MySQL) and ERP (ERPNext) use **different branch naming**
- Example: SIVFU calls it "JKT", ERP calls it "JKT01"
- Need to compare data from both systems side-by-side
- Manual reconciliation was time-consuming

**The Solution:**
- ✅ Created unified **Combined Replenishment Report**
- ✅ Merged data from SIVFU (internal DB) and ERP (ERPNext) in real-time
- ✅ Branch name mapping for consistency (JKT ↔ JKT01, SBY ↔ SBY01, etc.)
- ✅ Side-by-side comparison view
- ✅ Export combined data to CSV

**Technical Details:**
```typescript
// Branch Mapping (branch-mapping.ts)
export const BRANCH_MAPPING: Record<string, string> = {
  'JKT': 'JKT01',
  'SBY': 'SBY01',
  'SMG': 'SMG01',
  'MDN': 'MDN01',
  // ... 35 branches total
}

// Reverse mapping for lookup
export const REVERSE_BRANCH_MAPPING: Record<string, string> = {
  'JKT01': 'JKT',
  'SBY01': 'SBY',
  // ...
}
```

**Data Flow:**
1. Fetch SIVFU data from `/api/reports/replenishment-sivfu`
2. Fetch ERP data from `/api/reports/replenishment` (ERPNext server script)
3. Map branch names using `BRANCH_MAPPING`
4. Merge by item_code + branch
5. Display combined view with both systems' data

**How to Use:**
1. Navigate to **Reports → Combined Replenishment** (`/reports/replenishment-combined`)
2. Wait for data to load from both systems (~5-10 seconds)
3. View merged data showing:
   - **Item Code & Name**
   - **SIVFU Stock** vs **ERP Stock**
   - **SIVFU Replenish** vs **ERP Replenish**
   - **SIVFU DOI** vs **ERP DOI**
   - **SIVFU Avg Flow** vs **ERP Avg Flow**
4. Compare discrepancies between systems
5. Click **Export CSV** to download combined report

**Use Cases:**
- Reconcile stock levels between SIVFU and ERP
- Identify data inconsistencies
- Audit replenishment calculations
- Cross-system validation

**Branch Coverage:**
All 35 branches mapped between systems:
```
SIVFU → ERP
JKT   → JKT01
SBY   → SBY01
SMG   → SMG01
MDN   → MDN01
HO    → HO01
... (30 more)
```

---

#### 4. **ERP Replenishment Report - Server Script Migration**
**Files Changed:**
- `src/app/api/reports/replenishment/route.ts` (Major refactor)
- `src/app/reports/replenishment/page.tsx` (Updated data handling)

**The Problem:**
- Previous version used **complex 500+ line SQL query** directly against ERPNext DB
- Slow performance (~2-3 minutes)
- Difficult to maintain
- National Avg Flow calculation showing NaN errors

**The Solution:**
- ✅ Migrated to **ERPNext Server Script endpoint** (`/api/method/sinergia_integration.calculate_replenishment`)
- ✅ Added proper ERPNext authentication:
  - Primary: **API Key + API Secret** (token-based)
  - Fallback: **Basic Auth** (username + password from ERPNext login)
- ✅ Fixed national Avg Flow NaN issue
- ✅ Cleaner, more maintainable code
- ✅ Better error handling

**Technical Details:**
```typescript
// Authentication Flow
1. Try API Key + Secret (from .env.local)
   Authorization: token API_KEY:API_SECRET

2. If fails, try Basic Auth
   Authorization: Basic base64(username:password)

3. Request to ERPNext:
   GET /api/method/sinergia_integration.calculate_replenishment
```

**Server Script Endpoint (ERPNext):**
```python
# frappe/apps/sinergia_integration/calculate_replenishment.py
@frappe.whitelist()
def calculate_replenishment():
    # Complex SQL logic moved to ERPNext
    # Returns replenishment data for all branches
    return {
        "message": {
            "success": True,
            "data": [...],  # Replenishment rows
            "total": 653
        }
    }
```

**How to Use:**
1. Navigate to **Reports → ERP Replenishment** (`/reports/replenishment`)
2. Data fetches automatically from ERPNext server script
3. View replenishment data from ERP system:
   - Item Code & Name
   - Current Stock per branch
   - Suggested Replenishment per branch
   - DOI (Days of Inventory)
   - Avg Flow per branch
4. Click **Export CSV** to download

**Performance Improvement:**
- Before: ~2-3 minutes (complex SQL query)
- After: ~5-10 seconds (optimized server script)

**Authentication Setup:**
```env
# .env.local
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
```

Or use fallback Basic Auth (auto-fetched from ERPNext login session).

---

#### 5. **Customer Activation Page**
**Files Changed:**
- `src/app/(dashboard)/customers/activation/page.tsx` ✨ NEW
- `src/app/api/customers/activation/search/route.ts` ✨ NEW
- `src/app/api/customers/activation/activate/route.ts` ✨ NEW
- `src/types/customer.ts` (Updated with activation types)

**The Problem:**
- Need to activate/deactivate customer accounts in ERPNext
- Manual process through ERPNext UI was slow
- No bulk activation capability
- No search/filter functionality

**The Solution:**
- ✅ Built dedicated **Customer Activation Page**
- ✅ Search customers by name or customer code
- ✅ One-click activate/deactivate
- ✅ Real-time status updates
- ✅ Integrated directly with ERPNext Customer doctype
- ✅ Batch activation support (future enhancement)

**Technical Details:**
```typescript
// Search API
GET /api/customers/activation/search?query=CUST001

// Activate/Deactivate API
POST /api/customers/activation/activate
Body: {
  customerName: "CUST001",
  disabled: 0  // 0 = active, 1 = disabled
}

// ERPNext Integration
frappe.client.set_value('Customer', customerName, 'disabled', disabled)
```

**How to Use:**
1. Navigate to **Customers → Activation** (`/customers/activation`)
2. Use search bar to find customer:
   - By customer name (e.g., "PT Maju Jaya")
   - By customer code (e.g., "CUST001")
3. View search results with:
   - Customer Name
   - Customer Code
   - Current Status (Active ✅ / Inactive ⛔)
   - Territory/Area
4. Click **Activate** or **Deactivate** button
5. Status updates immediately in ERPNext
6. Green toast notification confirms success

**Use Cases:**
- Reactivate dormant customers
- Deactivate customers with payment issues
- Bulk status changes (future)
- Customer lifecycle management

**Status Badge:**
- 🟢 **Active** - Customer can place orders
- 🔴 **Inactive** - Customer blocked from ordering

---

#### 6. **HST Event Page (Jogja 2025)**
**Files Changed:**
- `src/app/event/HST/jogja2025/page.tsx` ✨ NEW
- `src/app/event/HST/jogja2025/[day]/page.tsx` ✨ NEW (Dynamic route)
- `public/video/DAY 1.webm` ✨ NEW (Video asset)
- `public/video/DAY 2.webm` ✨ NEW
- `public/video/DAY 3.webm` ✨ NEW

**The Problem:**
- Need landing page for HST (Hair Styling Trend) event in Jogja
- Event spans 3 days with different content per day
- Need to embed video content for each day
- Responsive design for mobile/desktop viewing

**The Solution:**
- ✅ Built event landing page with day navigation
- ✅ Dynamic routing for day-specific content (`/event/HST/jogja2025/1`, `/2`, `/3`)
- ✅ Video integration using `.webm` format for optimal compression
- ✅ Responsive design with Tailwind CSS
- ✅ Event branding and styling

**Technical Details:**
```typescript
// Dynamic Route Structure
/event/HST/jogja2025          → Main landing page
/event/HST/jogja2025/1        → Day 1 content
/event/HST/jogja2025/2        → Day 2 content  
/event/HST/jogja2025/3        → Day 3 content

// Video Integration
<video controls className="w-full rounded-lg">
  <source src="/video/DAY 1.webm" type="video/webm" />
  Your browser does not support video playback.
</video>
```

**How to Use:**
1. Navigate to event page: `/event/HST/jogja2025`
2. View event overview and schedule
3. Click **Day 1**, **Day 2**, or **Day 3** buttons
4. Watch embedded video for selected day
5. Navigate between days using navigation controls

**Content Structure:**
- **Landing Page:** Event info, schedule, location
- **Day 1:** Morning session content + video
- **Day 2:** Afternoon session content + video
- **Day 3:** Final day highlights + video

**Video Format:**
- Format: WebM (VP9 codec)
- Resolution: 1920×1080 (Full HD)
- Compression: Optimized for web streaming
- Fallback: Browser compatibility message

---

#### 7. **Sales Orders Management**
**Files Changed:**
- `src/app/(dashboard)/sales/orders/page.tsx` ✨ NEW (List view)
- `src/app/(dashboard)/sales/orders/[id]/page.tsx` ✨ NEW (Detail view)
- `src/app/api/sales-orders/route.ts` ✨ NEW (API endpoint)
- `src/types/sales-order.ts` ✨ NEW (Type definitions)
- `SALES-ORDERS.md` ✨ NEW (Documentation)

**The Problem:**
- Need visibility into sales orders from ERPNext
- Manual checking in ERPNext UI was inefficient
- No quick overview of order status
- Difficult to track order lifecycle

**The Solution:**
- ✅ Built **Sales Orders List Page** with search and filters
- ✅ **Sales Order Detail Page** with full order information
- ✅ Status tracking: Draft, Submitted, Completed, Cancelled
- ✅ Customer information display
- ✅ Item list with quantities, prices, and totals
- ✅ Direct link to customer detail page
- ✅ Pagination for large order lists

**Technical Details:**
```typescript
// Sales Order Type
interface SalesOrder {
  name: string              // SO-00001
  customer: string          // Customer name
  customer_name: string     // Display name
  transaction_date: string  // Order date
  delivery_date: string     // Expected delivery
  status: 'Draft' | 'Submitted' | 'Completed' | 'Cancelled'
  grand_total: number       // Total amount
  items: SalesOrderItem[]   // Order items
}

// API Endpoints
GET /api/sales-orders              // List all orders
GET /api/sales-orders?id=SO-00001  // Get specific order
```

**How to Use:**

**List View:**
1. Navigate to **Sales → Orders** (`/sales/orders`)
2. View all sales orders in table format:
   - Order ID (e.g., SO-00001)
   - Customer Name
   - Order Date
   - Delivery Date
   - Status Badge
   - Grand Total
3. Use search box to find specific order
4. Click on order row to view details

**Detail View:**
1. Click any order from list view
2. View comprehensive order information:
   - **Header:** Order ID, Date, Status
   - **Customer:** Name, code, territory, link to customer page
   - **Items Table:**
     - Item Code & Name
     - Quantity & UOM
     - Rate & Amount
   - **Totals:** Subtotal, Tax, Grand Total
3. Click customer name to view customer details
4. Click **Back to Orders** to return to list

**Status Badges:**
- 🟡 **Draft** - Order being prepared
- 🔵 **Submitted** - Order confirmed, awaiting fulfillment
- 🟢 **Completed** - Order delivered
- 🔴 **Cancelled** - Order cancelled

**Use Cases:**
- Track order status
- Review order details quickly
- Monitor delivery schedules
- Audit order history
- Customer service inquiries

---

### 🔧 Technical Improvements

#### 1. **Session Management Fix**
**Files Changed:**
- `src/lib/utils/sessionManager.ts`
- `src/components/common/AuthGuard.tsx`
- `SESSION-FIX.md` ✨ NEW

**What's Fixed:**
- ✅ Turned off auto check auth interval (prevented spam)
- ✅ Fixed session persistence issues
- ✅ Better session validation logic

---

#### 2. **ERPNext Integration**
**Files Changed:**
- `src/lib/api/clients.ts`
- `src/lib/constants/erp.ts`
- `src/store/authStore.ts`

**What's New:**
- ✅ Unified ERP client with authentication
- ✅ API token + Basic auth fallback
- ✅ Better error handling
- ✅ Connection health checks

---

#### 3. **SSH Tunnel for Database**
**Files Changed:**
- `src/lib/db/ssh-tunnel.ts` ✨ NEW
- `src/lib/db/mysql.ts` ✨ NEW
- `src/lib/db/mysql2.ts` ✨ NEW
- `setup-ssh-keys.ps1` ✨ NEW
- `setup-ssh-keys.sh` ✨ NEW
- `SSH-SECURITY.md` ✨ NEW

**What's New:**
- ✅ Secure SSH tunnel for remote MySQL access
- ✅ Supports both mysql and mysql2 drivers
- ✅ SSH key-based authentication
- ✅ Connection pooling

**How to Setup:**
1. Run `setup-ssh-keys.ps1` (Windows) or `setup-ssh-keys.sh` (Linux)
2. Configure SSH settings in `.env.local`
3. App automatically creates tunnel on startup

---

#### 4. **Docker Deployment**
**Files Changed:**
- `Dockerfile` ✨ NEW
- `Dockerfile.dev` ✨ NEW
- `docker-compose.yml` ✨ NEW
- `docker-compose.dev.yml` ✨ NEW
- `docker-compose.prod.yml` ✨ NEW
- `docker-compose.simple.yml` ✨ NEW
- `DOCKER.md` ✨ NEW

**What's New:**
- ✅ Full Docker support for development and production
- ✅ Multi-stage builds for optimization
- ✅ Nginx reverse proxy
- ✅ Redis session storage
- ✅ Health check endpoints

**How to Use:**
```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up -d

# Simple (no Redis)
docker-compose -f docker-compose.simple.yml up -d
```

---

#### 5. **Ubuntu/Linux Deployment**
**Files Changed:**
- `deploy-ubuntu-simple.sh` ✨ NEW
- `setup-ubuntu.sh` ✨ NEW
- `UBUNTU-DEPLOYMENT.md` ✨ NEW
- `DEPLOYMENT.md` ✨ NEW

**What's New:**
- ✅ Automated Ubuntu deployment script
- ✅ Handles port conflicts (Redis 6380)
- ✅ SSL certificate generation
- ✅ Environment file management

**How to Deploy:**
```bash
# Setup Ubuntu
chmod +x setup-ubuntu.sh
sudo ./setup-ubuntu.sh

# Deploy app
chmod +x deploy-ubuntu-simple.sh
./deploy-ubuntu-simple.sh
```

---

### 🎨 UI/UX Improvements

1. **Charts Components** ✨ NEW
   - `src/components/charts/BarChart.tsx`
   - `src/components/charts/DonutChart.tsx`
   - `src/components/charts/LineChart.tsx`

2. **Filter Components**
   - `src/components/filters/AreaFilter.tsx` ✨ NEW
   - `src/components/filters/BrandFilter.tsx`

3. **UI Components**
   - `src/components/ui/CustomerCard.tsx` ✨ NEW
   - `src/components/ui/Pagination.tsx` ✨ NEW

---

### 📊 Data Types Added

1. **Combined Replenishment** - `src/types/combined-replenishment.ts` ✨ NEW
2. **Customer** - `src/types/customer.ts` ✨ NEW
3. **Sales Order** - `src/types/sales-order.ts` ✨ NEW
4. **Replenishment** - `src/types/replenishment.ts` ✨ NEW

---

## 📝 Summary

### New Features Count
- ✨ **7 Major Features** (detailed above)
  1. SIVFU Replenishment + Per-Branch Avg Flow
  2. Voucher "Bebas Pilih" 25K Tolerance
  3. Combined Replenishment Report (SIVFU + ERP)
  4. ERP Replenishment - Server Script Migration
  5. Customer Activation Page
  6. HST Event Page (Jogja 2025)
  7. Sales Orders Management

- 🔧 **5 Technical Improvements** (Session fix, ERP integration, SSH tunnel, Docker, Ubuntu)
- 🎨 **3 UI Component Categories** (Charts, Filters, UI elements)

### Files Changed (Recent Work)
- **Total:** ~20 files
- **New Files:** ~15 files
- **Modified Files:** ~5 files
- **Documentation:** 2 MD files (CHANGELOG, SALES-ORDERS)

### Key Metrics
- **35 branches** supported in all replenishment reports
- **Rp 25.000 tolerance** for voucher redemption (±2% flexibility)
- **70-75 seconds** query execution for SIVFU report
- **653 items** in replenishment data
- **446 total columns** in SIVFU report (after Avg Flow addition)
- **~5-10 seconds** ERP report load time (after server script migration)

---

## 🚀 Quick Start Guide

### Access Key Features:
1. **SIVFU Replenishment:** `/reports/replenishment-sivfu` ⭐
2. **Combined Replenishment:** `/reports/replenishment-combined` ⭐
3. **ERP Replenishment:** `/reports/replenishment`
4. **Voucher Redemption:** `/voucher/[promoCode]` ⭐
5. **Customer Activation:** `/customers/activation` ⭐
6. **HST Event:** `/event/HST/jogja2025` ⭐
7. **Sales Orders:** `/sales/orders` ⭐

---

## 📚 Documentation Files
- `CHANGELOG.md` - This file
- `DOCKER.md` - Docker setup and usage
- `SSH-SECURITY.md` - SSH tunnel configuration
- `DEPLOYMENT.md` - General deployment guide
- `UBUNTU-DEPLOYMENT.md` - Ubuntu-specific deployment
- `SESSION-FIX.md` - Session management fixes
- `SALES-ORDERS.md` - Sales order feature docs

---

**Last Updated:** December 9, 2025  
**Version:** 2.0.0  
**Environment:** Production-ready with Docker support
