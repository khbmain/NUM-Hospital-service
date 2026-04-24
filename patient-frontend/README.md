# Patient Frontend

Patient frontend нь өвчтөн өөрөө мэдээллээ бөглөж, үйлчилгээ/эмч/төхөөрөмжийн цаг авах web application юм.

## Responsibilities

- Patient login
- Personal medical profile completion
- Service-first appointment booking
- Doctor/resource/device slot selection
- Viewing personal appointments
- Viewing visit history and prescriptions

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
cd patient-frontend
npm install
npm run dev
```

Default URL:

```text
http://localhost:3000
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

## Appointment Booking Flow

The booking page is:

```text
src/pages/AppointmentBookPage.tsx
```

Current flow:

1. `Миний мэдээлэл` - patient profile form
2. `Үйлчилгээ` - choose service
3. `Сонголт` - choose doctor/resource/device
4. `Өдөр & Цаг` - choose available slot
5. `Баталгаажуулах` - create appointment

Profile is saved through:

```graphql
upsertMyPatientProfile(input: PatientProfileInput!)
```

Appointment is created through:

```graphql
createAppointment(input: CreateAppointmentInput!)
```

## Patient Profile

Required before booking:

- Registration number
- Firstname
- Lastname
- Phone
- Gender
- Birthdate

Additional medical fields:

- Blood type
- Allergies
- Chronic conditions
- Regular medications
- Medical warnings
- Emergency contact
- Address
- Notes

## Slot Display

Available slots come from:

```graphql
getAvailableSlots(doctorId, serviceId, resourceId, date)
```

Each slot includes:

- `time`
- `available`
- `remaining`
- `capacity`
- `startsAt`
- `endsAt`

This supports:

- Doctor consultation slots
- Infusion room with 8-seat capacity
- Device resources with buffer time

## Development Notes

- GraphQL operations live under `src/graphql`.
- Shared UI components live under `src/components`.
- Patient pages live under `src/pages`.
- The patient app should not call WHO ICD APIs directly; ICD is an admin/doctor workflow routed through backend.
