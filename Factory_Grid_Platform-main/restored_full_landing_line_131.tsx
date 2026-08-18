# Enterprise B2B SaaS Onboarding Workflow Redesign

## Goal
Transform FactoryGrid's onboarding from public self-registration forms into a true Enterprise B2B SaaS workflow (similar to SAP Ariba, Oracle Procurement Cloud, Microsoft Dynamics 365, and Coupa).

---

## Technical Architecture & Core Principles

1. **Zero Public Self-Registration**:
   - Public users can NEVER register themselves directly or fill multi-step self-onboarding forms on public pages.
   - All public CTA buttons ("Apply as Buyer", "Register Plant", "Buyer Qualification", "Manufacturer Onboarding") are completely removed.

2. **Landing Page CTA Simplification**:
   - Landing page navbar & hero buttons will contain ONLY:
     - `Request Demo`
     - `Contact Sales`
     - `Sign In`

3. **Unified Enterprise Access Request Modal**:
   - Clicking `Request Demo` or `Contact Sales` opens a modal for submitting a corporate access request (Company Name, Contact Person, Corporate Email, Phone, Account Type, Sourcing/Manufacturing Scope).
   - Submitting this form logs a new Lead/Application in `AppContext` and displays a professional enterprise confirmation notice ("Request Received. Our Sales Qualification team will review your organization. Upon compliance verification and admin approval, credentials will be dispatched via invitation email.").

4. **Internal Enterprise Onboarding Pipeline (End-to-End Flow)**:
   ```
   Landing Page (Request Demo / Contact Sales)
             │
             ▼
   Sales Qualification (Internal Sales CRM - CustomerModule)
             │
             ▼
   Compliance Verification (Internal Regulatory Desk - ComplianceModule)
             │
             ▼
   Platform Admin Approval (Internal Admin Console - SettingsModule)
             │
             ▼
   System Code Generation (Buyer Code: BUY-2026-xxx / Mfg Code: MFG-2026-xxx)
             │
             ▼
   Invitation Email Dispatched -> User Sign In -> Role Dashboard
   ```

---

## Proposed File Changes

### 1. [LandingPage.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/pages/LandingPage.tsx)
- Replace all "Apply as Buyer", "Register Plant", "Join as Manufacturer", and duplicate onboarding buttons across Navbar, Hero, and CTA sections.
- Standardize all action buttons to open the unified `EnterpriseAccessRequestModal` or navigate to `Sign In`.
- Keep Navbar CTAs as `Request Demo` and `Sign In`.
- Keep Hero CTAs as `Request Demo` and `Contact Sales`.

### 2. [NEW] EnterpriseAccessRequestModal.tsx
- Create a reusable modal component for public users to request demo / enterprise access.
- Captures corporate details and triggers internal sales lead creation in `AppContext`.

### 3. [App.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/App.tsx)
- Clean up any standalone public onboarding routes (`buyer-register`, `mfg-register`) so they redirect to main app / open access request modal if accessed.

### 4. [CustomerModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/CustomerModule.tsx) (Sales Qualification)
- Display incoming demo & access requests in the `LEAD` stage of the CRM pipeline.
- Allow Sales Managers to qualify leads and advance them to `COMPLIANCE_PENDING`.

### 5. [ComplianceModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/ComplianceModule.tsx) (Compliance Verification)
- Showcase pending compliance verification cases linked to onboarding organizations.
- Allow Compliance Officers to verify Form 20B/21B & WHO-GMP certifications and approve compliance cases.

### 6. [SettingsModule.tsx](file:///c:/Users/yuvik/Downloads/Factory_Grid_Platform/src/components/modules/SettingsModule.tsx) (Platform Admin Approval & Code Generation)
- In the `ORGANIZATIONS` tab, add a **Pending Organization Approvals** queue.
- Platform Admin clicks "Approve & Provision Account".
- System automatically:
  1. Generates official Buyer Code (e.g. `BUY-2026-891`) or Manufacturer Code (e.g. `MFG-2026-442`).
  2. Provisions active account credentials in user directory.
  3. Dispatches invitation notification/email.
  4. Records immutable entry in Audit Trail.

---

## Verification Plan

### Automated Verification
- Run `npm run build` to verify clean compilation with zero TypeScript errors.

### Manual Verification
1. **Landing Page**: Verify Navbar & Hero contain ONLY `Request Demo`, `Contact Sales`, `Sign In`.
2. **Access Request**: Click `Request Demo` -> Fill corporate inquiry form -> Confirm confirmation message is displayed.
3. **Sales Qualification**: Switch to `SALES_MANAGER` role -> Open Sales CRM -> Verify request appears in `LEAD` pipeline stage.
4. **Compliance Verification**: Switch to `COMPLIANCE_OFFICER` role -> Open Compliance Desk -> Verify case under review and click Approve.
5. **Admin Approval & Code Generation**: Switch to `ADMIN` role -> Open Settings -> Organizations -> Click "Approve & Provision Account" -> Confirm system generates unique Buyer/Mfg Code and dispatches invitation email.
6. **Login**: Login with provisioned account credentials -> Access Role-Based Dashboard.
