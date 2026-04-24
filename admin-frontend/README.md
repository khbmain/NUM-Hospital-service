# Admin Frontend

Admin frontend нь эмч, сувилагч, бүртгэл, superadmin хэрэглэгчдэд зориулсан React/Vite web application юм.

## Responsibilities

- Staff login
- Dashboard
- Patient search and management
- Appointment list and check-in/cancel actions
- Doctor queue and examination page
- ICD-11 diagnosis picker
- Staff management
- Monthly reports

## Tech Stack

- React 18
- Vite
- TypeScript
- Apollo Client
- React Router
- Tailwind CSS
- Lucide icons

## Setup

```powershell
cd admin-frontend
npm install
npm run dev
```

Default URL:

```text
http://localhost:3001
```

Build:

```powershell
npm run build
```

Preview production build:

```powershell
npm run preview
```

## Backend Proxy

Vite proxies:

```text
/graphql -> http://localhost:4000
/auth    -> http://localhost:4000
```

See `vite.config.ts`.

## Main Routes

- `/login` - staff login
- `/` - dashboard
- `/patients` - patient list/search
- `/appointments` - appointment operations
- `/doctor/queue` - doctor queue
- `/doctor/examine/:visitId` - examination workflow
- `/staff` - staff management
- `/reports` - monthly report

Some routes are role-protected in `src/App.tsx`.

## ICD-11 UX

ICD picker component:

```text
src/components/icd/Icd11Picker.tsx
```

It supports:

- Search through backend `icd11Search`
- Chapter -> subchapter -> diagnosis navigation
- Selecting ICD code/title/URI data into diagnosis form

The component does not call WHO directly. It calls the backend GraphQL API, and backend calls the local ICD-11 Docker API.

## Doctor Examination Workflow

`src/pages/doctor/ExaminePage.tsx` contains:

- Vital signs
- Visit notes
- ICD-11 diagnosis
- Prescription creation
- Complete visit action

Diagnosis saves both local diagnosis fields and ICD-11 metadata:

- `icdCode`
- `icdTitle`
- `icdVersion`
- `icdLinearization`
- `icdLinearizationUri`
- `icdFoundationUri`

## Reports

Monthly report page:

```text
src/pages/reports/MonthlyReportPage.tsx
```

It uses:

```graphql
monthlyReport(month: String!)
```

Displayed sections:

- Total completed records
- Completed appointments
- Completed doctor visits
- Age groups
- Gender
- Services
- Resources/devices
- Doctors

## Development Notes

- Keep domain data in GraphQL query/mutation files under `src/graphql`.
- Shared visual components live under `src/components`.
- Route-level screens live under `src/pages`.
- Avoid calling external APIs directly from the browser when backend proxy exists.
