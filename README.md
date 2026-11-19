# Portafolio de Maximiliano Turdera Colque

Portafolio en Next.js 16 y NestJS 12. Los proyectos publicados y los mensajes de contacto se guardan en PostgreSQL de Supabase. El navegador se comunica con NestJS; la API usa la clave publicable de Supabase y políticas RLS.

## Estructura

- `apps/web`: interfaz Next.js y proxy del formulario.
- `apps/api`: API NestJS con `GET /api/projects`, `POST /api/contact` y `GET /api/health`.
- `supabase/migrations`: tablas y permisos RLS.
- `compose.dev.yml`: PostgreSQL local para desarrollo aislado y pruebas.

## Ejecutar el portafolio

Requiere Node.js 24 y npm. El archivo `.env` local está configurado para el proyecto alojado de Supabase y excluido de Git. Si partes de una copia nueva, crea `.env` desde `.env.example` y completa `SUPABASE_PUBLISHABLE_KEY` desde **Supabase → Project Settings → API Keys**.

```powershell
npm ci
npm run dev:api
```

En otra terminal:

```powershell
npm run dev:web
```

Abre [http://localhost:3000](http://localhost:3000). Si la API ya estaba abierta antes de cambiar `.env`, detén ese proceso con Ctrl+C y vuelve a iniciarlo para que tome la configuración nueva.

## Comprobación manual

1. Ejecuta `Invoke-RestMethod http://localhost:3001/api/health`; debe responder `status: ok`.
2. Ejecuta `(Invoke-RestMethod http://localhost:3001/api/projects).Count`; debe responder `3`.
3. En la página, envía un mensaje de contacto con nombre, correo válido y al menos 10 caracteres. Debe aparecer “Tu mensaje quedó guardado”.
4. Abre [Supabase → Table Editor → contact_messages](https://supabase.com/dashboard/project/ddvjfhcgvpaqbxeusoyz/editor) y actualiza la tabla. El mensaje nuevo debe aparecer allí.

La consulta `docker compose -f compose.dev.yml exec -T postgres psql ...` lee la base **local** de Docker. Sus filas no aparecen automáticamente en Supabase. `DATABASE_PROVIDER=supabase` hace que las nuevas solicitudes de NestJS vayan al proyecto alojado.

## Base de datos y seguridad

`.env` define `DATABASE_PROVIDER=supabase`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Para usar PostgreSQL local, cambia `DATABASE_PROVIDER=postgres`, inicia `docker compose -f compose.dev.yml up -d` y ejecuta `npm run db:migrate` y `npm run db:seed`. La base de pruebas sigue usando `TEST_DATABASE_URL` local.

Las políticas RLS permiten a visitantes leer solo proyectos publicados e insertar mensajes válidos. No permiten leer mensajes, editar proyectos ni borrar datos. Los mensajes se consultan en el panel de Supabase. `npm run db:migrate` y `npm run db:seed` son para la base local; no ejecutan cambios en el proyecto alojado.

## Pruebas

```powershell
npm run typecheck
npm run test:unit
npm run build
docker compose -f compose.dev.yml up -d
npm run test:integration
npm run test:e2e
```

Hay tres pruebas unitarias, tres de integración y cuatro E2E. Integración y E2E usan la base local `portfolio_test`, nunca el proyecto alojado. Para E2E, los puertos 3000 y 3001 deben estar libres; detén los servidores de desarrollo antes de ejecutarlas.

## Próximas etapas

El workflow de GitHub Actions ejecuta las pruebas en cada push a `dev`. Los Dockerfile y `compose.prod.yml` están listos para publicación manual: consulta [docs/publicar-dockerhub.md](docs/publicar-dockerhub.md). Terraform para Oracle Cloud y la configuración de la VM quedan para la etapa siguiente.
