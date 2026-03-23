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
- **API codegen**: Orval (from OpenAPI spec)
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

- **Inicio**: Dashboard con estadísticas, eventos próximos, acciones rápidas
- **Eventos**: Lista con filtros por estado, creación/edición con asignación de músicos y clientes
- **Clientes**: Catálogo con búsqueda, perfil con historial de eventos
- **Músicos**: Catálogo con búsqueda por instrumento, perfil con eventos asignados
- **Reportes**: Gráficas de ingresos (diario/semanal/mensual), resumen financiero, historial de pagos
- **Pagos**: Registro de anticipos y pagos, seguimiento por evento

## Database Schema

- `clients` — clientes registrados
- `musicians` — músicos con instrumentos y tarifas
- `events` — eventos con estado, monto, cliente
- `event_musicians` — relación muchos a muchos entre eventos y músicos
- `payments` — pagos con tipo (anticipo/parcial/total) y método

## Theme

Dark theme with gold/amber primary color (#C9A84C) on dark charcoal background.

## Running codegen

```
pnpm --filter @workspace/api-spec run codegen
```

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Routes: health, clients, musicians, events, payments, reports

### `artifacts/cuarto-arte` (`@workspace/cuarto-arte`)
Expo app with file-based routing using Expo Router, React Query for data fetching.
