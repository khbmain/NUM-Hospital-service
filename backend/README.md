# Backend

Backend нь Express + Apollo GraphQL + MongoDB/Mongoose stack дээр ажилладаг API service юм.

## Responsibilities

- Auth, JWT, OAuth callback
- Patient profile and medical record data
- Staff, department, service, resource management
- Appointment scheduling and capacity/buffer conflict checks
- Doctor visits, vital signs, diagnoses, prescriptions
- ICD-11 local API proxy
- Monthly report aggregation
- Audit logging and notification hooks

## Tech Stack

- Node.js
- TypeScript
- Express
- Apollo Server
- GraphQL subscriptions via `graphql-ws`
- MongoDB/Mongoose
- Yarn 4 via Corepack

## Setup

```powershell
cd backend
corepack yarn install
Copy-Item .env.example .env
```

Edit `.env` with real local values.

Run development server:

```powershell
corepack yarn dev
```

Build:

```powershell
corepack yarn build
```

Run production build:

```powershell
corepack yarn start
```

Seed scripts:

```powershell
corepack yarn seed
corepack yarn seed:demo
```

## Environment

Important env groups:

- Server: `PORT`, `NODE_ENV`
- Database: `MONGODB_URI`
- Auth: `JWT_SECRET`, `JWT_EXPIRATION`
- Frontend URLs: `PATIENT_FRONTEND_URL`, `ADMIN_FRONTEND_URL`
- ICD-11 local API: `ICD_API_BASE_URL`, `ICD_RELEASE`, `ICD_LINEARIZATION`, `ICD_LANGUAGE`
- Optional integrations: S3, email, SMS, Firebase, NUM/SISI OAuth

Do not commit `.env`. Keep only example keys in `.env.example`.

## GraphQL Areas

Root schema is composed from `src/graphql/typeDefs`.

Main query/mutation domains:

- Auth/users
- Patients
- Staff/departments
- Services/resources
- Appointments
- Visits/vital signs
- Diagnoses
- Prescriptions
- Notifications
- ICD-11
- Monthly reports

## Scheduling Model

The appointment model supports old doctor-based booking and new service/resource-based booking.

Core fields:

- `serviceId` - what the patient books
- `resourceId` - where/who the service is performed on
- `doctorId`, `nurseId`, `assignedStaffId` - optional staff links
- `scheduledStart`, `scheduledEnd`, `blockedUntil`
- `durationMinutes`, `bufferMinutes`
- `appointmentKind`

Conflict logic lives in `src/services/schedulingService.ts`.

Rules:

- Capacity room, for example infusion room: allow overlapping appointments until `capacity` is reached.
- Device resource, for example massage chair: `capacity = 1`, and conflict uses `blockedUntil`, not only patient-facing end time.
- Cancelled and no-show appointments do not block slots.

Default scheduling seed creates:

- Doctor consultation
- Nurse injection
- IV infusion
- IV access
- Irradiation
- Massage chair
- Infusion room with `capacity = 8`
- Basic injection room and sample device resources

The seed can be triggered from GraphQL with `seedDefaultScheduling` by authorized staff.

## ICD-11 Integration

ICD proxy service:

```text
src/services/icdService.ts
```

GraphQL fields:

- `icd11RootChapters(language)`
- `icd11Children(uri, language)`
- `icd11Search(q, language)`

Default local Docker API:

```text
ICD_API_BASE_URL=http://localhost
ICD_RELEASE=2026-01
ICD_LINEARIZATION=mms
ICD_LANGUAGE=en
```

The backend sends:

- `Accept: application/json`
- `API-Version: v2`
- `Accept-Language`

## Reports

Monthly report service:

```text
src/services/reportService.ts
```

GraphQL:

```graphql
monthlyReport(month: String!): MonthlyReport!
```

Input month format:

```text
YYYY-MM
```

The report currently aggregates completed appointments and completed visits by:

- Age group
- Gender
- Service
- Resource
- Doctor

## Useful Checks

Build:

```powershell
corepack yarn build
```

Schema import:

```powershell
corepack yarn ts-node -e "import './src/graphql/index'; console.log('schema ok')"
```

Health:

```powershell
Invoke-WebRequest http://localhost:4000/health
```
