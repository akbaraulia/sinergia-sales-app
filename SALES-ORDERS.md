# Sales Orders Feature

## Overview
Sales Orders feature allows users to view and manage their sales orders from ERPNext system.

## Features

### List Page (`/sales/orders`)
- Display all sales orders for the current user
- **Pagination**:
  - Configurable items per page (5, 10, 20, 50, 100)
  - First, Previous, Next, Last navigation
  - Page number buttons (smart pagination with ellipsis)
  - Auto-reset to page 1 when filters change
  - Shows current range (e.g., "1-10 of 45 orders")
- Search functionality (by order number, customer name)
- Filter by status (Completed, To Deliver, Draft, etc.)
- Order cards showing:
  - Order number and status badge
  - Customer information
  - Grand total amount
  - Transaction & delivery dates
  - Delivery and billing progress
  - Sales team members
  - Total items count
- Click on any order to view details
- Responsive design (mobile pagination simplified)

### Detail Page (`/sales/orders/[id]`)
- Complete order information:
  - Order header with status
  - Customer details
  - Transaction dates (transaction date, delivery date, PO number)
  - Progress tracking (delivered %, billed %)
  - Sales team members with avatars
  - Itemized list with:
    - Product images (from ERP)
    - **Image preview on click** - Opens full-size modal
    - Hover effects with zoom icon overlay
    - Item codes and names
    - Quantities and rates
    - Line amounts
  - Order summary (total items, total quantity, grand total)
  - Company information
- **Image Modal Features**:
  - Click product thumbnail to view large image
  - Full-screen modal with backdrop blur
  - ESC key or click outside to close
  - Responsive sizing (max 90vh)
  - Fallback to placeholder if image fails
  - Product name in modal header

## API Endpoint

### Base Endpoint
```
GET /api/sales-orders
```

### Parameters
- `so_id` (optional) - Sales Order ID to fetch specific order details

### Response Format
```json
{
  "data": [
    {
      "name": "SAL-ORD-2025-01248",
      "title": "{customer_name}",
      "customer": "Gorjes Salon -  Jakarta",
      "customer_name": "Gorjes Salon",
      "transaction_date": "2025-10-09",
      "delivery_date": "2025-10-10",
      "po_no": null,
      "company": "PT Sinergia Beaute Indonesia",
      "grand_total": 12853400,
      "status": "Completed",
      "per_delivered": 100,
      "per_billed": 100,
      "items": [
        {
          "item_code": "1010201021",
          "item_name": "Ilvasto Hair Cream Colourant  3.0 100 ml  Vegan",
          "qty": 4,
          "rate": 103000,
          "amount": 412000,
          "image": "/files/3.0-A.jpg"
        }
      ],
      "sales_team": [
        {
          "sales_person": "Vacant - DC Masyuri",
          "sales_person_name": "Vacant - DC Masyuri"
        }
      ]
    }
  ]
}
```

## ERP Integration

### Backend Endpoint
```
{ERP_BASE_URL}/api/method/get_sales_orders_by_sales_person
```

### Parameters
- `so_id` (optional) - Filter to specific sales order

### Image Handling
Product images are fetched from ERPNext:
- Base URL: `{ERP_CONFIG.BASE_URL}`
- Image path from API is appended to base URL
- Example: `/files/product.jpg` becomes `https://sinergia.digitalasiasolusindo.com/files/product.jpg`
- Fallback to `/placeholder-product.png` if image fails to load

## Status Mapping

| ERP Status | Badge Type |
|-----------|-----------|
| Completed | approved (green) |
| To Deliver and Bill | active (blue) |
| To Bill | active (blue) |
| To Deliver | active (blue) |
| Draft | draft (gray) |
| Cancelled | rejected (red) |
| On Hold | pending (yellow) |

## Components Used

### UI Components
- `Button` - Action buttons
- `StatusBadge` - Order status indicators
- `Badge` - General badges for labels
- `LoadingCard` - Loading states

### Layout Components
- `DashboardLayout` - Main dashboard wrapper
- `AuthGuard` - Authentication protection

### Common Components
- `ToastProvider` - Notification system

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── sales-orders/
│   │       └── route.ts              # API route handler
│   └── (dashboard)/
│       └── sales/
│           └── orders/
│               ├── page.tsx           # List page
│               └── [id]/
│                   └── page.tsx       # Detail page
├── types/
│   └── sales-order.ts                # TypeScript interfaces
└── lib/
    └── constants/
        └── erp.ts                    # ERP configuration

```

## TypeScript Interfaces

### SalesOrder
```typescript
interface SalesOrder {
  name: string
  title: string
  customer: string
  customer_name: string
  transaction_date: string
  delivery_date: string
  po_no: string | null
  company: string
  grand_total: number
  status: string
  per_delivered: number
  per_billed: number
  items: SalesOrderItem[]
  sales_team: SalesTeamMember[]
}
```

### SalesOrderItem
```typescript
interface SalesOrderItem {
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
  image: string | null
}
```

### SalesTeamMember
```typescript
interface SalesTeamMember {
  sales_person: string
  sales_person_name: string
}
```

## Permissions
- Available for users with `sales` permission
- Sales team members can view their own orders
- Admins can view all orders

## Navigation
- Main menu: **Sales** > **Orders**
- Dashboard quick action: **Sales Orders**
- Direct URL: `/sales/orders`

## Styling
- Follows design system color palette:
  - Primary: Asparagus (green) for actions and highlights
  - Secondary: Champagne (beige) for backgrounds
  - Status colors: Green (approved), Blue (active), Red (rejected), Yellow (pending)
- Dark mode support throughout
- Responsive design for mobile, tablet, and desktop

## Future Enhancements
- [x] Pagination with configurable page size
- [x] Image preview modal with full-size view
- [ ] Create new sales order functionality
- [ ] Edit existing orders
- [ ] Print/export order to PDF
- [ ] Email order to customer
- [ ] Add notes/comments to orders
- [ ] Track order history/timeline
- [ ] Bulk actions (export multiple orders)
- [ ] Advanced filtering (date range, amount range, sales person)
- [ ] Sorting options (by date, amount, status)
- [ ] Server-side pagination for better performance with large datasets
- [ ] Image gallery carousel for multiple product images
- [ ] Download image functionality
