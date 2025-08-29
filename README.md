# Prueba Técnica - Cinema Management API

API REST para gestión de películas y turnos de cine (Node.js + TypeScript + Express + Prisma + PostgreSQL).

## Contenido de la entrega
- Código backend en la carpeta raíz del repo.
- Migraciones Prisma en `prisma/migrations/`.
- Test e2e para solapamiento en `src/__tests__/turnos.e2e.test.ts`.
- Workflow de CI en `.github/workflows/ci.yml`.
- Colección Postman en `postman/Cinema Management API.postman_collection.json`.
- `README.md` con instrucciones de instalación y ejecución.

## Requisitos
- Node.js 18+ y npm
- PostgreSQL 15+
- (Opcional) Docker para ejecutar servicios en contenedores
- PowerShell en Windows o terminal bash en Linux/macOS

## Variables de entorno
Copia ` .env.example` -> `.env` y ajusta los valores. Variables importantes:
- `DATABASE_URL` — URL de conexión a PostgreSQL (ej: `postgresql://user:pass@host:5432/dbname`)
- `JWT_SECRET` — secreto para firmar tokens JWT
- `PORT` — puerto del servidor (por defecto 3000)

## Pasos rápidos (desarrollo local)

1. Instalar dependencias
```powershell
cd "d:\PruebaTecnicaCorporación la Sirena\backendApisCorporacionLaSirena"
npm install

2. Generar Prisma Client
npx prisma generate

3. (IMPORTANTE) Crear la extensión btree_gist si usas PostgreSQL local
-Si tu usuario es superuser:
psql -U postgres -d cinema -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"
-Si estás en un servicio gestionado (RDS, Cloud SQL) debes solicitar al DBA/proveedor habilitar btree_gist. La migración que evita solapamientos depende de esta extensión.

4. Aplicar migraciones

npx prisma migrate deploy --schema=./prisma/schema.prisma

5. (Opcional) Poblar datos iniciales
npm run db:seed

6. Ejecutar servidor en desarrollo
npm run dev
# o, tras build
npm run build
npm start

Ejecutar tests e2e localmente
Asegúrate de que la DB esté disponible y que las migraciones se hayan aplicado:

npx prisma generate
npx prisma migrate deploy --schema=./prisma/schema.prisma
npm run test:e2e:local

El test e2e turnos.e2e.test.ts verifica que crear un turno válido devuelve 201 y que intentar crear uno solapado devuelve 409.

CI
Se incluyó un workflow GitHub Actions en .github/workflows/ci.yml que:

Levanta un servicio Postgres (imagen oficial).
Ejecuta npx prisma generate y npx prisma migrate deploy.
Ejecuta las pruebas e2e (npm run test:e2e:local).
Nota: el workflow usa la imagen Postgres de Actions, la cual permite crear extensiones; en otros entornos gestionados debes coordinar la creación de btree_gist.

Colección Postman
La colección Postman está en:
postman/Cinema Management API.postman_collection.json
Impórtala en Postman o Insomnia para probar los endpoints manualmente.
