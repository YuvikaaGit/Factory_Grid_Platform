# FactoryGrid — Enterprise B2B Pharma Procurement Redesign

## Overview

FactoryGrid is a B2B Pharmaceutical Procurement Platform. After deep codebase analysis, the existing project has a solid React architecture with Context API state management, a design system in CSS, and 18 module components. The goal is to **add missing enterprise UX**, fix wrong UX patterns, and refine existing components — **without breaking anything**.

> [!IMPORTANT]
> **NOTHING in LandingPage.tsx, App.tsx routing, AppContext.tsx APIs, or data types will be modified.** All changes are additive or UX-improvement within the existing modules and pages.

---

## What Exists (Preserved as-is)
- `LandingPage.tsx` — DO NOT TOUCH
- `App.tsx` — routes preserved
- `AppContext.tsx` — all APIs preserved
- `types/index.ts` — all types preserved
- `data/mockData.ts` — all mock data preserved
- All component imports and exports preserved

---

## Issues Found & What Will Be Fixed

### 1. Login Page — Wrong Registration UX
**Problem**: `LoginPage.tsx` has a multi-step registration wizard with buyer/manufacturer registration forms. This violates the enterprise flow (no public registration).
**Fix**: Replace the registration section with a clean "Request Organization Access" CTA that shows a simple inquiry form (name, company, email, role requested). Keep the login form and the split layout.

### 2. App.tsx — buyer-register / mfg-register Public Routes
**Problem**: `buyer-register` and `mfg-register` pages expose public onboarding, which contradicts enterprise SaaS flow.
**Fix**: These routes will remain (do not break existing routes) but the `BuyerOnboardingWizard` and `ManufacturerOnboardingWizard` will be updated to show a "Sales Team Contacts You" interstitial when `isPublicPage=true`, clarifying the enterprise flow. The forms themselves become internal tools (admin creates accounts).

### 3. Sidebar — Missing Manufacturer Role Sections & Wrong Role Mixing
**Problem**: The sidebar shows same items across roles. The nav items need SUPPLIER-specific items (Assigned RFQs, Quote Submission, Manufacturing Lane, etc.) while hiding buyer-only items.
**Fix**: Update `navGroups` in `DashboardLayout.tsx` to add SUPPLIER-specific nav items with correct role filtering. Add `manufacturer-workspace` as a new tab entry for the Supplier's dedicated workspace.

### 4. CustomerModule — CRM lacks Pipeline stages matching business flow
**Problem**: Pipeline stages are generic ("Qualified Lead", "RFQ Issued", etc.) but should match the exact business flow (Lead → Demo Scheduled → Documents Received → Compliance Pending → Approved → Live).
**Fix**: Update pipeline data and stage logic in `CustomerModule.tsx` to match the spec exactly. Add Revenue Forecast section and Conversion Funnel panel.

### 5. AccountsModule — Uses colorful badges, needs ERP style
**Problem**: Uses `ent-badge` colored pills. Should use minimal dot + text status indicators.
**Fix**: Replace badge rendering with professional dot indicators throughout `AccountsModule.tsx`. Add Overdue Aging table and AR Summary section.

### 6. SettingsModule — Admin console needs Azure/SAP Fiori style
**Problem**: Functional but could use cleaner layout. Missing API Health, Organizations panel, and System Health dashboard in proper enterprise style.
**Fix**: Refactor `SettingsModule.tsx` to add `ORGANIZATIONS`, `API_HEALTH` tabs with clean flat enterprise styling. Remove any colorful pills.

### 7. ManufacturerModule — Missing active workflow for SUPPLIER role
**Problem**: The manufacturer directory works for admin/buyer view but there's no dedicated **Supplier Dashboard** showing: Assigned RFQs → Submit Quote → Receive Sub Order → Manufacturing Lane → Dispatch.
**Fix**: Create a new `ManufacturerWorkspaceModule.tsx` for the SUPPLIER role that shows their own workflow perspective. Add it to the routing.

### 8. Missing: Dedicated Admin Console Page
**Problem**: Settings module serves as admin but needs dedicated admin sections for Organizations, User Provisioning, and API health.
**Fix**: Extend `SettingsModule.tsx` with Organizations tab and API Health tab.

### 9. BuyerOnboardingWizard — accessible as public page (wrong flow)
**Problem**: The onboarding wizard is available directly as a public page, bypassing the sales qualification flow.
**Fix**: When `isPublicPage=true`, show an enterprise "Request Demo" landing that explains the qualification flow. The actual wizard is internal to admin/compliance workflow.

### 10. Badge Component — Uses colorful pills everywhere
**Problem**: `Badge.tsx` renders colorful rounded pills (success, danger, warning).
**Fix**: Update `Badge.tsx` to use small dot + text pattern. Also update `index.css` `.ent-badge` to be flat/minimal.

### 11. Missing: Sales Manager CRM Pipeline (proper enterprise style)
**Problem**: The CustomerModule has a basic pipeline grid but needs: proper CRM stages matching the business flow, a Revenue Forecast section, Conversion Funnel, and Customer Lifecycle Timeline.
**Fix**: Major update to `CustomerModule.tsx` to implement these sections.

---

## Proposed Changes

### Component 1: CSS Design System

#### [MODIFY] [index.css](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/index.css)
- Update `.ent-badge` to use flat minimal style (no rounded pills, use dot + text)
- Add new utility classes: `.ent-status-dot`, `.ent-status-row`, `.ent-kpi-strip`, `.ent-section-divider`
- Add enterprise table improvements: narrower padding, cleaner hover states
- Ensure all colors match the approved enterprise palette (no purple/pink/bright yellow)

---

### Component 2: Badge Component

#### [MODIFY] [Badge.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/common/Badge.tsx)
- Replace rounded pill badges with flat status indicators (dot + label)
- Keep the same `status` prop interface for backward compatibility

---

### Component 3: Login Page

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/pages/LoginPage.tsx)
- Keep the split layout and left panel (preserve existing working login logic)
- Remove the multi-step registration wizard from the login form section
- Replace register section with simple "Need Enterprise Access? → Request Organization Access" link that opens a minimal 3-field inquiry modal (name, company, email) — no complex wizard
- Keep the category tabs (Buyer Company, Manufacturer, FactoryGrid Staff) for login routing
- Keep `handleLoginSubmit` function, role switching, and all navigation logic intact

---

### Component 4: Dashboard Layout — Sidebar Enhancement

#### [MODIFY] [DashboardLayout.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/pages/DashboardLayout.tsx)
- Add SUPPLIER-specific nav items:
  - `mfg-workspace` → "Manufacturing Workspace" (SUPPLIER only)
  - Keep `rfqs` → SUPPLIER sees it as "Assigned RFQs"
  - Keep `quotes` → SUPPLIER sees it as "Quote Submissions"
  - Keep `orders` → SUPPLIER sees it as "Sub-Order Management"
  - Keep `shipments` → SUPPLIER sees it as "Dispatch & Tracking"
- Add `renderContent()` case for `mfg-workspace` → renders `ManufacturerWorkspaceModule`
- Improve sidebar group labeling for SUPPLIER role context

---

### Component 5: New — Manufacturer Workspace Module (Supplier View)

#### [NEW] [ManufacturerWorkspaceModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/ManufacturerWorkspaceModule.tsx)
A dedicated module for the `SUPPLIER` role. Shows:
- **Dashboard Strip**: Active Sub-Orders, Quotes Submitted, Pending RFQs, Dispatched
- **Workflow Tabs**: 
  - "Assigned RFQs" — RFQs matched to this manufacturer
  - "My Quotes" — Quotes this manufacturer has submitted
  - "Production Lane" — Sub-orders with production status stepper (reuses existing `updateSubOrderStatus`)
  - "Dispatch Queue" — Sub-orders ready to dispatch with shipment creation
  - "Invoice & Payment" — Manufacturer-side payment status

---

### Component 6: Customer Module — Enterprise CRM Upgrade

#### [MODIFY] [CustomerModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/CustomerModule.tsx)
- Update CRM pipeline stages to match business flow:
  - Lead → Demo Scheduled → Documents Received → Compliance Pending → Approved Customer → Live Customer
- Add proper **Conversion Funnel** section showing stage counts
- Add **Revenue Forecast** KPI strip (Q3/Q4 forecast vs. actual)
- Add **Follow-up Calendar** section (list of upcoming activities)
- Remove any Kanban-style cards, keep table format
- Update Activity Timeline to show proper pharma-specific interactions

---

### Component 7: Accounts Module — ERP Style Upgrade

#### [MODIFY] [AccountsModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/AccountsModule.tsx)
- Add **Overdue Aging Buckets** section: 0-30 days, 31-60 days, 61-90 days, 90+ days
- Add **AR Summary Strip**: Total Billed, Collected, Outstanding, Overdue
- Replace colorful badge pills with `● Status Text` dot pattern
- Add **Payment Reconciliation** tab
- Keep all existing `recordInvoicePayment` functionality intact

---

### Component 8: Settings Module — Azure/SAP Admin Console

#### [MODIFY] [SettingsModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/SettingsModule.tsx)
- Add **Organizations** tab: list of buyer companies + manufacturer companies with status
- Add **API Health** tab: endpoint status grid with latency and uptime
- Refactor existing USERS/RBAC/SYSTEM/AUDIT tabs to flat enterprise style
- Remove colorful badges, use dot status indicators
- Add proper section headers in Azure Admin Center style

---

### Component 9: Compliance Module — Expiry Alerts & Audit History

#### [MODIFY] [ComplianceModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/ComplianceModule.tsx)
- Add **Certificate Expiry Alerts** section (30/60/90 day warnings)
- Add **Audit History** tab showing complete verification history
- Improve the document verification UI to be more SAP Fiori-like
- Keep all existing `approveComplianceCase`, `verifyComplianceDocument` APIs intact

---

### Component 10: Buyer Onboarding Wizard — Public Page Fix

#### [MODIFY] [BuyerOnboardingWizard.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/BuyerOnboardingWizard.tsx)
- When `isPublicPage=true`, show an enterprise "How Onboarding Works" info page with flow diagram and "Contact Sales" CTA instead of the full registration form
- When `isPublicPage=false` (internal admin use), show the full wizard as before
- Preserve all existing `submitBuyerOnboarding` API calls

#### [MODIFY] [ManufacturerOnboardingWizard.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/ManufacturerOnboardingWizard.tsx)
- Same pattern as BuyerOnboardingWizard — public page shows enterprise info, internal keeps wizard

---

### Component 11: Dashboards — Role-Specific Improvements

#### [MODIFY] [Dashboards.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/Dashboards.tsx)
- **SUPPLIER dashboard**: Add a proper "Operations Control Room" dashboard showing: Active Sub-Orders, RFQs to Quote, Production Schedule, Dispatch Queue
- Keep BUYER, ADMIN, SALES, ACCOUNTS, COMPLIANCE dashboards as-is (they are already well-structured)

---

## Files NOT Modified (Preserved)
- `LandingPage.tsx` — COMPLETELY UNTOUCHED
- `AppContext.tsx` — COMPLETELY UNTOUCHED  
- `types/index.ts` — COMPLETELY UNTOUCHED
- `data/mockData.ts` — COMPLETELY UNTOUCHED
- `main.tsx` — UNTOUCHED
- `vite.config.ts` — UNTOUCHED
- `ThemeContext.tsx` — UNTOUCHED
- `AICopilotDrawer.tsx` — UNTOUCHED
- `CommandPalette.tsx` — UNTOUCHED
- `LogoMark.tsx` — UNTOUCHED
- `Illustrations.tsx` — UNTOUCHED
- `MetricCard.tsx` — UNTOUCHED
- `AnalyticsModule.tsx` — UNTOUCHED
- `InvoiceModule.tsx` — UNTOUCHED
- `NotificationsModule.tsx` — UNTOUCHED
- `OrderModule.tsx` — UNTOUCHED
- `ProductCatalogModule.tsx` — UNTOUCHED
- `QuoteModule.tsx` — UNTOUCHED
- `ReportsModule.tsx` — UNTOUCHED
- `ShipmentModule.tsx` — UNTOUCHED
- `BuyerOrderTrackingModule.tsx` — UNTOUCHED
- `ManufacturerModule.tsx` — UNTOUCHED (admin/buyer view of directory)

---

## Execution Order

1. `Badge.tsx` — update status indicators (foundational)
2. `index.css` — update design tokens and utility classes
3. `LoginPage.tsx` — fix registration UX
4. `ManufacturerWorkspaceModule.tsx` — create new file
5. `DashboardLayout.tsx` — add manufacturer workspace route + sidebar items
6. `Dashboards.tsx` — add SUPPLIER dashboard
7. `CustomerModule.tsx` — enterprise CRM upgrade
8. `AccountsModule.tsx` — ERP style + aging
9. `SettingsModule.tsx` — Azure admin console
10. `ComplianceModule.tsx` — expiry alerts + audit history
11. `BuyerOnboardingWizard.tsx` — fix public page
12. `ManufacturerOnboardingWizard.tsx` — fix public page

---

## Verification Plan

### Automated
- `npm run dev` — verify app starts without errors
- Check TypeScript compilation: no type errors

### Manual
- Switch between all 6 roles in RoleSwitcherDropdown, verify each role sees correct sidebar
- Login as BUYER → navigate all procurement workflow tabs
- Login as SUPPLIER → verify ManufacturerWorkspace appears and shows correct data
- Login as COMPLIANCE_OFFICER → verify compliance desk with expiry alerts
- Login as ADMIN → verify settings shows Organizations and API Health tabs
- Login as SALES_MANAGER → verify CRM pipeline with correct enterprise stages
- Login as ACCOUNTS_MANAGER → verify ERP-style AR with aging buckets
- Click "buyer-register" route → verify it shows enterprise info instead of public form
- Click "mfg-register" route → verify same
- Verify no public "Apply as Buyer" buttons exist anywhere in dashboard
- Verify Badge component uses dot indicators not colorful pills

---

## Open Questions for User Review

> [!NOTE]
> The existing landing page already has "Request Demo" and "Contact Sales" CTAs connecting to buyer/mfg registration flows (`buyer-register`, `mfg-register` routes). Per the spec, these routes are preserved (no breaking changes). The fix is to change what those pages SHOW — enterprise info flow instead of public registration forms.

> [!IMPORTANT]  
> Should the `ManufacturerModule.tsx` (admin/buyer view of Manufacturer Directory) remain fully separate from the new `ManufacturerWorkspaceModule.tsx` (supplier self-service view)? — **Yes**, they serve different roles:
> - `ManufacturerModule` = Admin/Buyer views the list of verified manufacturers (directory)
> - `ManufacturerWorkspaceModule` = Supplier logs in and sees their own workspace

> [!NOTE]
> The `SUPPLIER` role in code is called `SUPPLIER` but the spec refers to it as "Manufacturer". The existing code uses `SUPPLIER` throughout contexts and navGroups. The UI labels will say "Manufacturer" but the role key stays `SUPPLIER` to avoid breaking the role system.
