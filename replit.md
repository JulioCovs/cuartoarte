# Workspace

## Overview

pnpm workspace monorepo using TypeScript. **Cuarto Arte** — app móvil para gestión de eventos musicales y artísticos.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo / React Native with Expo Router

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── cuarto-arte/        # Expo mobile app
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## App Features (Cuarto Arte)

### Admin
- **Inicio**: Dashboard con KPIs, eventos próximos, acciones rápidas
- **Solicitudes**: Lista de contrataciones filtradas por estado (pendiente, aceptada, confirmada, rechazada); formulario para confirmar solicitudes aceptadas y crear evento automáticamente
- **Eventos**: Lista con filtros, creación/edición con asignación de músicos y clientes
- **Clientes**: Catálogo con búsqueda, perfil con historial de eventos
- **Músicos**: Catálogo con búsqueda por instrumento, perfil con eventos asignados
- **Reportes**: Gráficas de ingresos vs gastos (día/semana/mes), utilidad neta, gastos recientes, botón para registrar gasto

### Cliente
- **Catálogo**: Busca músicos y solicita contratación directamente
- **Mis Eventos**: Lista de eventos propios
- **Mis Solicitudes**: Seguimiento de solicitudes enviadas con estado en tiempo real
- **Mis Pagos**: Historial de pagos propios

### Músico
- **Solicitudes**: Lista de solicitudes pendientes con botones Aceptar/Rechazar
- **Mis Eventos**: Eventos asignados
- **Perfil**: Datos personales

## Auth

- JWT + bcrypt, roles: `admin`, `client`, `musician`
- Demo: admin@cuartoarte.com/admin123, cliente@ejemplo.com/cliente123, musico@ejemplo.com/musico123

## Database Schema

- `clients` — clientes registrados
- `musicians` — músicos con instrumentos y tarifas
- `events` — eventos con estado, monto, cliente
- `event_musicians` — relación muchos a muchos entre eventos y músicos
- `payments` — pagos con tipo (anticipo/parcial/total) y método
- `users` — usuarios con rol y FK a client/musician
- `booking_requests` — solicitudes de contratación (flujo: pending → accepted/rejected → confirmed/cancelled)
- `expenses` — gastos del negocio con categoría (musician_payment, venue, equipment, transport, otro)

## Booking Flow

1. Cliente navega al Catálogo y solicita un músico (POST /api/bookings)
2. Músico ve la solicitud en su tab "Solicitudes" y acepta o rechaza (PATCH /api/bookings/:id/respond)
3. Admin ve la solicitud "Aceptada" y la confirma completando precio/datos → se crea el evento automáticamente (PATCH /api/bookings/:id/confirm)

## API Routes

- `/api/auth/*` — login/me
- `/api/clients` — CRUD
- `/api/musicians` — CRUD
- `/api/events` — CRUD
- `/api/payments` — CRUD
- `/api/bookings` — CRUD + /respond + /confirm + /cancel
- `/api/expenses` — CRUD
- `/api/reports/income` — ingresos agrupados por período
- `/api/reports/expenses` — gastos agrupados por período
- `/api/reports/profit` — ingresos vs gastos con utilidad
- `/api/reports/summary` — KPIs generales

## Theme

Dark theme with gold/amber primary color (#C9A84C) on dark charcoal (#0D0D0D) background, dark surface (#1A1A1A).

## Notes

- Port collision fix: dev script does `fuser -k ${PORT:-8080}/tcp` before starting
- UUID strategy: `Date.now().toString() + Math.random()` (no uuid package)
- Numeric DB columns stored as strings; routes use parseFloat() for math
