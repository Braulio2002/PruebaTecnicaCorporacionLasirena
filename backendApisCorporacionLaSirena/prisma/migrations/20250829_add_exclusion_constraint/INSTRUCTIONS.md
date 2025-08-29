# Aplicar migración: exclusion constraint para turnos

Propósito: evitar solapamientos de turnos en la misma sala a nivel de base de datos usando una constraint de exclusión.

Archivos incluidos:

- `migration.sql`: contiene el SQL para habilitar `btree_gist` y agregar la constraint.

Requisitos:

- Debes tener permisos de superusuario en la base de datos para crear la extensión `btree_gist`.
- Asegúrate de tener una copia de seguridad antes de aplicar migraciones en producción.

Aplicar usando psql (Windows PowerShell):

1) Exporta la variable DATABASE_URL o reemplázala directamente en el comando.

$env:DATABASE_URL = "postgresql://user:password@host:port/dbname"

2)Ejecuta el SQL con psql:

psql $env:DATABASE_URL -f "./prisma/migrations/20250829_add_exclusion_constraint/migration.sql"

Si tu psql no acepta la URL de conexión directamente, descompónla en partes:

psql -h [host] -p [port] -U [user] -d [dbname] -f "./prisma/migrations/20250829_add_exclusion_constraint/migration.sql"

Rollback (si es estrictamente necesario):
psql $env:DATABASE_URL -c "ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_no_overlap_exclusion;"

Notas:
-Esta constraint previene solapamientos parciales y totales en la misma sala. Mantén las comprobaciones a nivel de aplicación como defensa adicional.

Pruebas E2E:
-El test `src/__tests__/turnos.e2e.test.ts` asume que el servidor está exportado desde `src/index.ts` como `app` y que la base de datos tiene aplicada la migración de exclusión.

- Ejecuta las migraciones y luego corre `npm run test:e2e` (configura tu script de package.json para iniciar el servidor o usa un entorno de test preparado).
