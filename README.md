# NUM Hospital Service

NUM Hospital Service нь жижиг эмнэлэг/их сургуулийн эрүүл мэндийн төвд зориулсан цаг захиалга, эмчийн үзлэг, өвчтөний бүртгэл, үйлчилгээ/төхөөрөмжийн хуваарь, ICD-11 онош, сарын тайлангийн систем юм.

Repository нь 3 тусдаа application-оос бүрдэнэ:

- `backend` - Express, Apollo GraphQL, MongoDB/Mongoose API
- `admin-frontend` - эмч, сувилагч, бүртгэл, админд зориулсан React/Vite web
- `patient-frontend` - өвчтөн өөрөө мэдээллээ бөглөж цаг авах React/Vite web

Project тус бүрийн нарийвчилсан setup, env, script, implementation notes:

- [Backend README](./backend/README.md)
- [Admin Frontend README](./admin-frontend/README.md)
- [Patient Frontend README](./patient-frontend/README.md)
- [Хэрэглэгчийн гарын авлага](./docs/USER_MANUAL.md)
- [Word хэрэглэгчийн гарын авлага](./docs/NUM-Hospital-Хэрэглэгчийн-гарын-авлага.docx)

## Гол боломжууд

- Өвчтөн өөрөө profile бөглөж цаг захиалах
- Эмч appointment-гүйгээр өвчтөн бүртгээд шууд үзлэг эхлүүлэх боломжтой backend суурь
- Эмчийн үзлэг: амин үзүүлэлт, өвчний түүх, онош, жор, зөвлөгөө
- ICD-11 local Docker API-тай холбогдсон онош сонголт
- Үйлчилгээ/resource-based цаг захиалга
- Дуслын өрөөний 8 суудлын capacity scheduling
- Шарлага, массажны сандал зэрэг тусдаа төхөөрөмжийн duration + buffer scheduling
- Сарын тайлан: насны бүлэг, хүйс, үйлчилгээ, төхөөрөмж/resource, эмчээр нэгтгэл

## Architecture

```text
patient-frontend  ─┐
                   ├── GraphQL / auth proxy ── backend ── MongoDB
admin-frontend   ──┘                         └── ICD-11 local Docker API
```

Default local ports:

```text
Backend API:       http://localhost:4000
Patient frontend:  http://localhost:3000
Admin frontend:    http://localhost:3001
ICD-11 Docker API: http://localhost
```

Frontend Vite servers proxy `/graphql` and `/auth` to the backend.

## Local Development

Prerequisites:

- Node.js 18+ for backend compatibility
- Corepack enabled for Yarn 4 backend
- npm for frontend projects
- MongoDB connection string
- Docker if ICD-11 local API is used

Install dependencies:

```powershell
cd backend
corepack yarn install

cd ..\admin-frontend
npm install

cd ..\patient-frontend
npm install
```

Create backend env:

```powershell
Copy-Item backend\.env.example backend\.env
```

Then edit `backend/.env` with real MongoDB/JWT/email/OAuth values. Do not commit `.env`.

Run all services from VS Code:

1. `Ctrl + Shift + P`
2. `Tasks: Run Task`
3. Select `dev: all`

Or run manually in 3 terminals:

```powershell
cd backend
corepack yarn dev
```

```powershell
cd patient-frontend
npm run dev
```

```powershell
cd admin-frontend
npm run dev
```

## ICD-11 Local API

The system expects WHO ICD-11 API to run locally by default:

```powershell
docker run -p 80:80 -e acceptLicense=true -e saveAnalytics=false whoicd/icd-api
```

Useful URLs:

- Browser: http://localhost/browse
- Coding Tool: http://localhost/ct
- Swagger: http://localhost/swagger/index.html

Current Docker release is English-only for ICD-11 MMS in this setup. The application UI can be Mongolian, but official ICD titles come from WHO in English unless a Mongolian MMS release becomes available.

## Data Model Summary

High-level domain collections:

- `patients` - demographic and medical profile data
- `staff` - doctors, nurses, operators, admins
- `services` - bookable services such as consultation, infusion, injection, device procedures
- `resources` - doctors, nurses, rooms, capacity rooms, devices
- `appointments` - service/resource-based bookings
- `visits` - doctor visit records
- `vital_signs` - visit-level measurements
- `diagnoses` - ICD-11-linked diagnoses
- `prescriptions` - prescriptions
- `audit_logs` - important action logs

The key scheduling concept is `service + resource + time`. A resource may have `capacity > 1` for cases like the infusion room, or `capacity = 1` with `bufferMinutes` for devices.

## Verification

Build commands:

```powershell
cd backend
corepack yarn build
```

```powershell
cd admin-frontend
npm run build
```

```powershell
cd patient-frontend
npm run build
```

GraphQL schema quick check:

```powershell
cd backend
corepack yarn ts-node -e "import './src/graphql/index'; console.log('schema ok')"
```

## Notes

- Keep secrets only in `.env`.
- Use `backend/.env.example` as the contract for required configuration keys.
- For detailed backend API notes, see [backend/README.md](./backend/README.md).
- For admin UX and routes, see [admin-frontend/README.md](./admin-frontend/README.md).
- For patient booking workflow, see [patient-frontend/README.md](./patient-frontend/README.md).
