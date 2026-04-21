# OpsFluency — User Journey Map

**Version:** 1.3
**Date:** April 2026
**Author:** Rob
**Status:** Active — MVP Phase

> Reference document for development. Keep brief. Expand or break out into separate files as the product grows.
>
> **Structure note.** This is currently a single file. As roles deepen in Phase 2+, split into `super-admin.md`, `admin.md`, `manager.md`, `employee.md`, `monitor.md` and keep this `README.md` as the index + shared concepts (roles overview, cross-cutting flows). Version bumps the top of this file; per-role files carry their own version lines once they exist.

---

## Roles Overview

| Role | Scope | Access |
|---|---|---|
| Super Admin | All orgs (internal only) | Full visibility across all organizations |
| Admin | One org | Billing, settings, all departments, all managers |
| Manager | One org | SOPs, employees, announcements, monitors, submissions board |
| Employee | One org | View SOPs, scan QR codes, announcements, HR chat, submit reports |
| Monitor | One org | Paired display device — no user login |

---

## 1. Super Admin Journey

### Entry Point
- Logs in via Clerk email + password
- Lands on internal Super Admin dashboard (separate from org-facing app)

### Main Flow

1. **Dashboard** -- View list of all organizations (name, plan, employee count, created date, last active)
2. **Org Detail** -- Drill into any org to view members, SOP count, plan status, billing state
3. **Support Actions** -- Resend magic links, view error logs, flag an org for review
4. **Plan Management** -- View and update subscription tier for any org if needed

### Key Decision Points
- Org appears inactive → investigate or flag for outreach
- Billing issue flagged → escalate or manually adjust plan state

### Exit State
- No session expiry enforced for Super Admin (internal tooling)
- Logs out manually

---

## 2. Admin Journey

### Entry Point
- Discovers OpsFluency (marketing site, referral, outbound)
- Clicks "Get Started" → Clerk signup (email + password)
- Selects a plan during onboarding
- Lands on org setup flow

### Main Flow

1. **Onboarding Setup**
   - Enter company name, phone, upload logo (optional)
   - Default departments created automatically (Safety, Equipment, Process, HR)
   - Prompted to invite first Manager

2. **Team Setup**
   - Invite Managers by business email
   - Assign role (Manager)
   - Assign department(s) -- this drives all submission routing across the org
   - Department assignments can be updated at any time after setup

3. **Submission Response Time Configuration**
   - Admin sets expected response time per submission category during onboarding
   - Safety Hazard is always treated as urgent -- not configurable, always escalated immediately
   - All other categories get org-defined response time targets (examples: 24 hours, 48 hours, 72 hours)
   - These thresholds drive visual warning flags on the Manager board when submissions go unacknowledged
   - Configurable at any time in org settings

4. **Billing**
   - Plan selected at signup (Starter / Growth / Scale)
   - Billing managed via **Paddle** — primary payment processor for all self-serve plans (Paddle acts as merchant of record, handling global sales tax / VAT)
   - **Stripe is reserved for at-scale / enterprise accounts** where direct processing fees become materially lower than Paddle's merchant-of-record margin. Admin doesn't choose the processor — it's a backend decision triggered when an account crosses the scale threshold, at which point the account is migrated by the Super Admin.
   - Plan upgrades/downgrades available in Settings (processor-agnostic from the Admin's perspective)

5. **Org Settings**
   - Update company name, logo, phone
   - Manage plan and billing
   - View all Managers and Employees in the org
   - Edit department assignments and response time thresholds

6. **Ongoing**
   - Admin can perform all Manager actions within their org
   - Receives billing notifications (renewal, failed payment, plan limit)
   - Has visibility into the full submissions board across all departments

### Key Decision Points
- Approaching employee tier limit → prompted to upgrade plan
- Failed payment → grace period notification → account suspension warning
- Admin can act as Manager at any time (full downward access)
- Response time threshold breached on any submission → visual flag appears on board card

### Exit State
- Logs out manually
- Session managed by Clerk

---

## 3. Manager Journey

### Entry Point
- Receives email invite from Admin
- Sets up Clerk account (email + password)
- Assigned to one or more departments by Admin during org setup
- Lands on Manager dashboard

### Main Flow

#### SOP Pipeline
1. **Import** -- Upload PDF, DOCX, or TXT file
2. **AI Conversion** -- Claude Sonnet converts to structured Markdown, flags site-specific terms
3. **Glossary Review** -- Manager defines all flagged terms (hard gate — cannot proceed until complete)
4. **Markdown Review** -- Manager reviews and edits converted content, selects display template
5. **Translation** -- System translates to Spanish using glossary context
6. **Spanish Approval** -- Manager reviews and approves Spanish version
7. **Publish** -- SOP goes live, QR code generated
8. **Print QR** -- Manager customizes and prints QR code for physical placement

#### Employee Management
1. Enter employee phone or email
2. System sends Clerk magic link (expires 72 hours)
3. View employee list with last-active timestamp
4. Resend magic links as needed
5. Assign employees to departments

#### Announcements
1. Write plain-text announcement
2. Set display duration (default 24 hours)
3. Select department scope (one dept or all)
4. System auto-translates to Spanish
5. Announcement appears on employee home dashboard and monitor displays

#### Monitor Setup
1. Navigate to monitor pairing screen
2. Open monitor pairing URL on TV browser
3. TV displays a QR code with pairing code
4. Manager scans QR with authenticated phone
5. Select department, set display name and theme
6. Monitor goes live automatically

#### Submissions and Project Management Board
The board is the Manager's central workspace for all employee submissions. Divided into two views:

**Top Level -- Safety Escalations**
- All Safety Hazard submissions appear here regardless of department
- Visible to all Managers and Admin
- Visually distinct -- red, urgent priority badge
- Manager assigned to Safety department is the primary owner
- New safety submission triggers an immediate push notification to all Managers
- No configurable response time -- Safety is always treated as urgent

**Department View -- All Other Submissions**
- Each Manager sees submissions routed to their assigned departments and categories
- Categories: Maintenance Issue, Process Idea, General Suggestion, SOP / Process Suggestion
- Submissions organized by category and status: Open, In Progress, Resolved
- Visual warning flag appears on a card when the org-defined response time threshold is breached

**Submission Workflow (per card)**
1. New submission appears on the board
2. Manager opens the slide-out drawer for that submission
3. Drawer shows: category, photo(s) if attached, original message (auto-translated to English if submitted in Spanish), timestamp, employee name
4. Manager replies in English -- employee receives reply in their preferred language (auto-translated)
5. Chat thread continues in the drawer until resolved
6. Manager marks submission as Resolved
7. Employee is notified that their submission is closed

**Default Routing Rules (driven by department assignments set in Admin onboarding)**
- Safety Hazard → Safety-assigned Manager + all Managers notified immediately
- Maintenance Issue → Equipment-assigned Manager
- Process Idea → Process-assigned Manager
- General Suggestion → Admin or designated Manager
- SOP / Process Suggestion → Manager assigned to the relevant department

#### Glossary Management
- View, add, edit, or delete terms at any time
- Terms apply to all future SOP translations automatically

### Key Decision Points
- Flagged terms not defined → translation blocked until resolved
- Spanish version rejected → manager edits and re-approves
- SOP approaching expiration → dashboard notification 14 days prior
- Employee magic link expired → manager resends from employee screen
- SOP updated → Spanish version flagged as stale → must re-approve before going live
- Safety submission received → immediate notification, top-level escalation on board
- Submission response time threshold breached → visual warning flag on board card (threshold set by Admin per category)

### Exit State
- Logs out manually
- Session managed by Clerk

---

## 4. Employee Journey

### Entry Point
- Manager enters their phone or email in the dashboard
- Employee receives Clerk magic link via SMS or email (expires 72 hours)
- Taps link → authenticated automatically, no password required
- Session persists on device after first login

### Main Flow

#### Onboarding
1. Sets preferred language (English or Spanish)
2. Lands on home dashboard

#### Home Dashboard
- Views manager announcements in preferred language
- Browses SOPs by department tab
- Sees recently updated SOPs
- Submission entry point visible on home screen
- My Submissions section shows status of all past and open submissions

#### QR Scan Flow
1. Taps QR scan button
2. Camera opens
3. Scans QR code on equipment or station
4. SOP opens instantly in preferred language
5. Can toggle between English and Spanish at any time
6. "Report an Issue" option available in context on every SOP view

#### Direct SOP Browse
- Browses by department
- Taps SOP to open
- Reads in preferred language
- Language toggle available on every SOP
- "Report an Issue" option available in context

#### Submitting a Report or Observation
1. Taps submit button (home screen or in-context on a SOP / after QR scan)
2. Selects a category:
   - Safety Hazard
   - Maintenance Issue
   - Process Idea
   - General Suggestion
   - SOP / Process Suggestion
3. Writes message in their preferred language (English or Spanish)
4. Optionally attaches one or more photos
5. Submits
6. Receives confirmation:
   - All categories → "Thank you for your submission. A manager will follow up with you."
   - Safety Hazard → "Your safety concern has been received and is being reviewed urgently."
7. If offline at time of submission → submission is silently queued and sent automatically when connection is restored. A clear status indicator shows the employee the submission is pending and will send when reconnected. Employee can view and manage queued submissions from their dashboard.

#### Employee Submission Dashboard
- Employee sees all their submissions in one place (mirrors the manager board from their side)
- Each submission shows: category, status (Pending Send, Open, In Progress, Resolved), timestamp
- Tapping any submission opens the chat thread for that submission
- Employee can see full message history and reply at any time
- Resolved submissions remain visible in read-only history
- Queued (offline) submissions are clearly labeled and can be edited or cancelled before they send

#### Submission Chat
- Each submission has its own dedicated chat thread
- Employee receives Manager replies in their preferred language (auto-translated)
- Employee replies in their preferred language (auto-translated to English for Manager)
- Separate from HR chat -- lives in the Submissions section of the app
- Employee is notified when Manager marks the submission Resolved
- Resolved threads move to read-only history

#### HR Module
- Views HR SOPs (onboarding, policies, benefits)
- Views HR contacts directory (name, role, phone, email)
- Initiates a chat with an HR contact
- Receives replies from HR in the chat thread

#### Offline Access
- Previously viewed SOPs are cached and readable without WiFi
- Submissions queued offline send automatically on reconnect with clear status shown to employee
- New SOPs and announcements are unavailable until reconnected

### Key Decision Points
- Magic link expired → employee contacts manager for a new link
- Preferred language not set → defaults to English with toggle available
- SOP not found after scan → friendly "no longer available" message (archived SOP)
- No WiFi → cached SOPs available, submission queued with visible pending status
- Submission resolved → employee notified, thread moves to read-only history

### Exit State
- No forced logout -- session persists on device
- Employee can install PWA to home screen for faster access

---

## 5. Monitor Journey

### Entry Point
- TV browser navigates to monitor pairing URL
- Fullscreen QR code with pairing code is displayed
- Manager scans and completes pairing (see Manager Journey -- Monitor Setup)

### Main Flow

1. **Paired and Active**
   - Displays department name and current date/time
   - Shows latest manager announcement (translated)
   - Shows recently updated SOPs (last 5)
   - Shows today's total scan count for the department
   - Displays company logo and branding

2. **Auto-Refresh**
   - Display refreshes on a set interval
   - No ongoing manager interaction required

3. **Heartbeat**
   - Heartbeat indicator visible in footer
   - Last-seen timestamp updated in the database on each refresh

### Key Decision Points
- Monitor goes offline → last-seen timestamp stops updating → manager can see status in dashboard
- Department has no recent activity → display shows baseline content (no errors)
- Pairing code expires before scan → manager refreshes the pairing screen to generate a new code

### Exit State
- Monitor runs continuously until the browser is closed or the device is powered off
- Re-pairing required if the session is lost

---

## Phase 2 Notes

- **Viewer role** -- Read-only access for supervisors, auditors, or corporate observers. Hold until a real use case emerges from customers.
- **Anonymous submissions** -- Employees choose to submit anonymously. Must be truly anonymous (no linkable identifiers stored). Requires a trust-building UI pattern on the employee side. Explore use cases for anonymous management information gathering campaigns. Design carefully -- employees have real trust concerns.
- **Additional languages** -- Vietnamese, Mandarin, Portuguese, Arabic. Journey unchanged, language options expand.
- **Required reading assignments** -- Employee journey gains a "Required" tab and completion confirmation step.
- **Video SOPs** -- SOP pipeline gains a video upload/embed step via Loom or Scribe integration.
- **Multi-location broadcast** -- Admin journey gains a cross-facility announcement channel.
- **Department-to-department chat** -- Employee journey expands beyond HR-only chat.
- **Submission analytics** -- Aggregate reporting on submission volume, category breakdown, response times, and resolution rates.

---

## Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 1.3 | 2026-04 | Rob | Payments: Paddle as primary processor (merchant of record) for all self-serve plans; Stripe reserved for at-scale/enterprise accounts where direct processing fees become materially lower. Migration is a Super Admin action, invisible to the Admin. |
| 1.2 | 2026-04 | Rob | MVP-phase journey map across all five roles, including submissions board, offline queue, and Admin-configurable response time thresholds. |
