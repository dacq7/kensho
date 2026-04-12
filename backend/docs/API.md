# Budokan SKIF — API Reference

> **Base URL (production):** `https://budokan-backend.up.railway.app/api`
> **Base URL (local):** `http://localhost:3001/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Karatecas](#karatecas)
3. [Asistencia](#asistencia)
4. [Mensualidades](#mensualidades)
5. [Pólizas](#pólizas)
6. [Inventario](#inventario)
7. [Dashboard](#dashboard)
8. [Config](#config)
9. [Health Check](#health-check)
10. [Data Models](#data-models)
11. [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained from `POST /auth/login`. Two roles exist:

| Role | Description |
|------|-------------|
| `SENSEI` | Administrator — full read/write access |
| `KARATECA` | Student — read access to own data |

---

### POST /auth/login

Authenticate a user and obtain a JWT token.

- **Auth:** None

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `numeroDocumento` | `string` | Yes | User's document number |
| `password` | `string` | Yes | User's password |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ user: User, token: string }` | Authentication successful |
| `401 Unauthorized` | `{ message: "Credenciales incorrectas" }` | Invalid credentials |

```json
// 200 OK
{
  "user": {
    "id": 1,
    "nombre": "Sensei Yamada",
    "email": "yamada@budokan.com",
    "rol": "SENSEI"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### GET /auth/me

Return the profile of the currently authenticated user.

- **Auth:** Any authenticated user

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `User` object | Current user's profile |
| `401 Unauthorized` | `{ message: "No autorizado" }` | Missing or invalid token |

---

### PATCH /auth/change-password

Change the authenticated karateca's own password.

- **Auth:** `KARATECA` (own account only)

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passwordActual` | `string` | Yes | Current password |
| `passwordNueva` | `string` | Yes | New password |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Contraseña actualizada" }` | Password changed successfully |
| `401 Unauthorized` | `{ message: "Contraseña actual incorrecta" }` | Wrong current password |

---

### PATCH /auth/reset-password/:userId

Reset any user's password. Intended for administrative use.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `number` | Target user's ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passwordNueva` | `string` | Yes | New password to set |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Contraseña actualizada" }` | Password reset successfully |
| `404 Not Found` | `{ message: "Usuario no encontrado" }` | User ID does not exist |

---

## Karatecas

Manage dojo members (students). Each karateca is linked to a `User` account.

---

### GET /karatecas

List all karatecas. By default, only active members are returned.

- **Auth:** Any authenticated user

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `incluirInactivos` | `boolean` | `false` | Set to `true` to include inactive members |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Karateca[]` | Array of karateca objects with nested `user` and `polizas` |

---

### GET /karatecas/:id

Retrieve a single karateca's full profile.

- **Auth:** Any authenticated user

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Karateca` | Full profile including nested `user`, `polizas`, and `mensualidades` |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | ID does not exist |

---

### POST /karatecas

Create a new karateca and their associated user account.

- **Auth:** `SENSEI` only

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nombre` | `string` | Yes | Full name |
| `email` | `string` | Yes | Unique email address |
| `password` | `string` | Yes | Initial password |
| `tipoDocumento` | `string` | Yes | Document type (e.g. `DNI`, `Pasaporte`) |
| `numeroDocumento` | `string` | Yes | Unique document number |
| `telefono` | `string` | No | Phone number |
| `fechaNacimiento` | `string (ISO date)` | No | Date of birth |
| `mesInicioMensualidades` | `string (YYYY-MM)` | No | Month from which monthly fees are tracked |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `201 Created` | `Karateca` | Newly created karateca object |
| `409 Conflict` | `{ message: "..." }` | Email or document number already exists |

---

### PUT /karatecas/:id

Update a karateca's personal information.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nombre` | `string` | Yes | Full name |
| `tipoDocumento` | `string` | Yes | Document type |
| `numeroDocumento` | `string` | Yes | Document number |
| `telefono` | `string` | No | Phone number |
| `fechaNacimiento` | `string (ISO date)` | No | Date of birth |
| `mesInicioMensualidades` | `string (YYYY-MM)` | No | Month from which monthly fees are tracked |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Karateca` | Updated karateca object |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | ID does not exist |

---

### PATCH /karatecas/:id/kyu

Update a karateca's current kyu rank and promotion date.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kyuActual` | `string` | Yes | New rank (e.g. `"6kyu"`, `"1dan"`) |
| `fechaUltimoAscenso` | `string (ISO date)` | Yes | Date of the promotion |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Karateca` | Updated karateca object |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | ID does not exist |

---

### PATCH /karatecas/:id/pre-examen

Set or clear the pre-exam approval flag for a karateca.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `preExamenAprobado` | `boolean` | Yes | `true` to approve, `false` to revoke |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ preExamenAprobado: boolean }` | Updated flag value |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | ID does not exist |

---

### PATCH /karatecas/:id/activo

Activate or deactivate a karateca (soft delete).

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activo` | `boolean` | Yes | `true` to activate, `false` to deactivate |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Karateca` | Updated karateca object |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | ID does not exist |

---

### DELETE /karatecas/:id

Permanently delete a karateca and their associated user account.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Karateca eliminado" }` | Deleted successfully |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | ID does not exist |

---

## Asistencia

Track and query class attendance records.

---

### GET /asistencias/fechas

Get a summary of attendance (present/absent counts) for each class day in a given month.

- **Auth:** Any authenticated user

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mes` | `string (YYYY-MM)` | Yes | Month to query |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `AttendanceSummary[]` | Array of daily summaries |

```json
// 200 OK
[
  { "fecha": "2025-03-03", "presentes": 12, "ausentes": 3 },
  { "fecha": "2025-03-05", "presentes": 14, "ausentes": 1 }
]
```

---

### GET /asistencias/fecha

Get the full attendance list for a specific class date.

- **Auth:** Any authenticated user

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fecha` | `string (YYYY-MM-DD)` | Yes | Class date to query |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | Array of karatecas with `presente: boolean` | Per-student attendance for the given date |

---

### GET /asistencias/karateca/:id

Get the full attendance history for a specific karateca.

- **Auth:** Any authenticated user

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Asistencia[]` | Array of attendance records for this student |

---

### POST /asistencias

Record or update attendance for an entire class session.

- **Auth:** `SENSEI` only

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fecha` | `string (YYYY-MM-DD)` | Yes | Class date |
| `registros` | `{ karatecaId: number, presente: boolean }[]` | Yes | Attendance entries for each student |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Asistencia registrada" }` | All records saved successfully |
| `400 Bad Request` | `{ message: "..." }` | Invalid date or malformed body |

---

## Mensualidades

Manage monthly fee payments and payment history.

---

### GET /mensualidades/mes

Get the payment status of every karateca for a given month.

- **Auth:** Any authenticated user

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mes` | `string (YYYY-MM)` | Yes | Month to query |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `MensualidadStatus[]` | Array with each karateca's fee status for the month |

```json
// 200 OK
[
  {
    "karatecaId": 3,
    "user": { "nombre": "Ana López", "email": "ana@example.com" },
    "mensualidad": { "id": 12, "mes": "2025-03", "monto": 5000, "pagado": true, "fechaPago": "2025-03-05" },
    "enMora": false
  }
]
```

---

### GET /mensualidades/karateca/:id

Get the full payment history for a specific karateca.

- **Auth:** Any authenticated user

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Mensualidad[]` | All mensualidad records for this student |

---

### POST /mensualidades/pago

Register a monthly fee payment for a karateca.

- **Auth:** `SENSEI` only

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `karatecaId` | `number` | Yes | Target karateca |
| `mes` | `string (YYYY-MM)` | Yes | Month being paid |
| `monto` | `number` | Yes | Amount paid |
| `fechaPago` | `string (YYYY-MM-DD)` | Yes | Date of payment |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Mensualidad` | Created or updated mensualidad record |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | Karateca ID does not exist |

---

### PATCH /mensualidades/:id/anular

Void a previously registered payment.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Mensualidad ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Pago anulado" }` | Payment voided successfully |
| `404 Not Found` | `{ message: "Mensualidad no encontrada" }` | ID does not exist |

---

## Pólizas

Manage insurance policy records for karatecas.

---

### GET /polizas

Get a summary of every karateca's insurance status.

- **Auth:** Any authenticated user

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `PolizaStatus[]` | Array of each karateca with their latest policy and computed status |

**`estado` values**

| Value | Meaning |
|-------|---------|
| `activa` | Policy is current |
| `por_vencer` | Policy expires within 30 days |
| `vencida` | Policy has expired |
| `sin_poliza` | No policy on file |

```json
// 200 OK
[
  {
    "karatecaId": 3,
    "karateca": { "nombre": "Ana López" },
    "poliza": { "id": 7, "aseguradora": "OSDE", "numeroPoliza": "POL-001", "fechaVencimiento": "2025-12-31" },
    "estado": "activa"
  }
]
```

---

### GET /polizas/karateca/:id

Get all policies for a specific karateca, each annotated with its computed status.

- **Auth:** Any authenticated user

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `(Poliza & { estado: string })[]` | All policies with `estado` field appended |

---

### POST /polizas

Create a new insurance policy for a karateca.

- **Auth:** `SENSEI` only

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `karatecaId` | `number` | Yes | Target karateca |
| `aseguradora` | `string` | Yes | Insurance company name |
| `numeroPoliza` | `string` | Yes | Policy number |
| `fechaInicio` | `string (YYYY-MM-DD)` | Yes | Policy start date |
| `fechaVencimiento` | `string (YYYY-MM-DD)` | Yes | Policy expiration date |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `201 Created` | `Poliza` | Newly created policy object |
| `404 Not Found` | `{ message: "Karateca no encontrado" }` | Karateca ID does not exist |

---

### PUT /polizas/:id

Update an existing insurance policy.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Poliza ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `aseguradora` | `string` | Yes | Insurance company name |
| `numeroPoliza` | `string` | Yes | Policy number |
| `fechaInicio` | `string (YYYY-MM-DD)` | Yes | Policy start date |
| `fechaVencimiento` | `string (YYYY-MM-DD)` | Yes | Policy expiration date |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Poliza` | Updated policy object |
| `404 Not Found` | `{ message: "Póliza no encontrada" }` | ID does not exist |

---

### DELETE /polizas/:id

Delete a single insurance policy.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Poliza ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Póliza eliminada" }` | Deleted successfully |
| `404 Not Found` | `{ message: "Póliza no encontrada" }` | ID does not exist |

---

### DELETE /polizas/karateca/:id

Delete the entire insurance policy history for a karateca.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Karateca ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Historial de pólizas eliminado" }` | All policies deleted successfully |

---

## Inventario

Manage dojo equipment and gear inventory.

---

### GET /inventario

List all inventory items.

- **Auth:** Any authenticated user

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Inventario[]` | Full list of inventory items |

---

### POST /inventario

Add a new item to the inventory.

- **Auth:** `SENSEI` only

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nombre` | `string` | Yes | Item name |
| `categoria` | `"PROTECCION" \| "INSTRUMENTO"` | Yes | Item category |
| `cantidad` | `number` | Yes | Quantity in stock |
| `estado` | `"BUENO" \| "REGULAR" \| "MALO"` | Yes | Condition |
| `notas` | `string` | No | Optional notes |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `201 Created` | `Inventario` | Newly created item |

---

### PUT /inventario/:id

Update an existing inventory item.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Inventario item ID |

**Request Body**

Same fields as `POST /inventario`.

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Inventario` | Updated item |
| `404 Not Found` | `{ message: "Ítem no encontrado" }` | ID does not exist |

---

### DELETE /inventario/:id

Remove an item from the inventory.

- **Auth:** `SENSEI` only

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | Inventario item ID |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ message: "Ítem eliminado" }` | Deleted successfully |
| `404 Not Found` | `{ message: "Ítem no encontrado" }` | ID does not exist |

---

## Dashboard

Aggregated views for the dojo overview and personal student dashboards.

---

### GET /dashboard/resumen

Return a high-level summary of the entire dojo for the sensei dashboard.

- **Auth:** `SENSEI` only

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | See schema below | Full dojo summary |

```json
// 200 OK
{
  "karatecas": {
    "total": 24,
    "preExamenAprobado": 6
  },
  "asistenciaPromedio": [
    { "karatecaId": 3, "nombre": "Ana López", "promedio": 87.5 }
  ],
  "mensualidades": {
    "alDia": [ /* Karateca objects */ ],
    "unMes": [ /* Karateca objects — 1 month behind */ ],
    "masDe1Mes": [ /* Karateca objects — 2+ months behind */ ]
  },
  "polizas": {
    "activas": 18,
    "porVencer": 3,
    "vencidas": 2
  },
  "inventario": {
    "bueno": 12,
    "regular": 5,
    "malo": 1
  }
}
```

---

### GET /dashboard/karateca

Return the personal dashboard for the authenticated karateca.

- **Auth:** `KARATECA` only

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | See schema below | Personal student summary |

```json
// 200 OK
{
  "karateca": {
    "id": 3,
    "kyuActual": "6kyu",
    "preExamenAprobado": false,
    "mesInicioMensualidades": "2024-03",
    "user": { "nombre": "Ana López", "email": "ana@example.com" }
  },
  "asistencia": {
    "promedio": 87.5,
    "totalClases": 24,
    "clasesAsistidas": 21
  },
  "mensualidades": [ /* Mensualidad objects */ ],
  "poliza": {
    "id": 7,
    "aseguradora": "OSDE",
    "numeroPoliza": "POL-001",
    "fechaInicio": "2025-01-01",
    "fechaVencimiento": "2025-12-31",
    "estado": "activa"
  }
}
```

---

## Config

Key-value configuration store for application-wide settings.

---

### POST /config

Create or update a configuration entry (upsert).

- **Auth:** `SENSEI` only

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clave` | `string` | Yes | Configuration key |
| `valor` | `string` | Yes | Configuration value |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `Config` | Upserted config object |

---

### GET /config/:clave

Retrieve a single configuration value by key.

- **Auth:** Any authenticated user

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `clave` | `string` | Configuration key |

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ clave: string, valor: string }` | Config entry |
| `404 Not Found` | `{ message: "Config no encontrada" }` | Key does not exist |

---

## Health Check

### GET /health

Verify that the API server is running and reachable.

- **Auth:** None

**Responses**

| Status | Body | Description |
|--------|------|-------------|
| `200 OK` | `{ status: "ok" }` | Server is healthy |

---

## Data Models

TypeScript type definitions derived from the Prisma schema.

---

### User

```typescript
type Rol = "SENSEI" | "KARATECA";

interface User {
  id: number;
  nombre: string;
  email: string;
  password: string;       // Never returned in API responses
  rol: Rol;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;  // ISO 8601 date string
  fechaIngreso: string;            // ISO 8601 date string
  createdAt: string;               // ISO 8601 date string
}
```

---

### Karateca

```typescript
interface Karateca {
  id: number;
  userId: number;
  kyuActual: string;               // e.g. "8kyu", "1dan"
  dan: number | null;
  preExamenAprobado: boolean;
  fechaUltimoAscenso: string | null; // ISO 8601 date string
  activo: boolean;
  mesInicioMensualidades: string | null; // YYYY-MM

  // Nested relations (included depending on endpoint)
  user?: User;
  polizas?: Poliza[];
  mensualidades?: Mensualidad[];
  asistencias?: Asistencia[];
}
```

---

### Asistencia

```typescript
interface Asistencia {
  id: number;
  karatecaId: number;
  fecha: string;           // ISO 8601 date string
  presente: boolean;
  registradoPorId: number;

  // Nested relations
  karateca?: Karateca;
}
```

---

### Mensualidad

```typescript
interface Mensualidad {
  id: number;
  karatecaId: number;
  mes: string;             // YYYY-MM
  monto: number;           // Stored as Decimal in DB
  pagado: boolean;
  fechaPago: string | null; // ISO 8601 date string

  // Nested relations
  karateca?: Karateca;
}
```

---

### Poliza

```typescript
interface Poliza {
  id: number;
  karatecaId: number;
  aseguradora: string;
  numeroPoliza: string;
  fechaInicio: string;       // ISO 8601 date string
  fechaVencimiento: string;  // ISO 8601 date string

  // Nested relations
  karateca?: Karateca;

  // Computed field (not stored in DB — returned by API)
  estado?: "activa" | "por_vencer" | "vencida" | "sin_poliza";
}
```

---

### Inventario

```typescript
type CategoriaInventario = "PROTECCION" | "INSTRUMENTO";
type EstadoInventario = "BUENO" | "REGULAR" | "MALO";

interface Inventario {
  id: number;
  nombre: string;
  categoria: CategoriaInventario;
  cantidad: number;
  estado: EstadoInventario;
  notas: string | null;
  updatedAt: string;  // ISO 8601 date string
}
```

---

### Config

```typescript
interface Config {
  id: number;
  clave: string;   // Unique key
  valor: string;
  updatedAt: string; // ISO 8601 date string
}
```

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "message": "Human-readable description of the error"
}
```

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `400 Bad Request` | Invalid request data | Missing required fields, malformed date strings, invalid enum values |
| `401 Unauthorized` | Authentication failed | Missing `Authorization` header, expired or invalid JWT, wrong credentials |
| `403 Forbidden` | Insufficient permissions | A `KARATECA` attempting a `SENSEI`-only action |
| `404 Not Found` | Resource not found | Referencing an ID that does not exist in the database |
| `409 Conflict` | Duplicate resource | Registering a user with an email or document number that already exists |
| `500 Internal Server Error` | Unexpected server error | Unhandled exception — contact the API maintainer |

### Example Error Responses

```json
// 401 Unauthorized
{ "message": "Credenciales incorrectas" }

// 403 Forbidden
{ "message": "No tienes permisos para realizar esta acción" }

// 404 Not Found
{ "message": "Karateca no encontrado" }

// 409 Conflict
{ "message": "El email ya está registrado" }
```

---

*Generated for Budokan SKIF — Sistema de Gestión de Dojo.*
