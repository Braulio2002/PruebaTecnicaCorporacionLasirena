# Migration: add_exclusion_constraint

-- Purpose: enable btree_gist extension and add exclusion constraint on turnos to prevent overlapping ranges per sala

-- NOTE: Apply this migration manually against your Postgres database using psql or a DB client, or integrate with Prisma's migration workflow. This file contains the SQL to run.

-- 1) Enable extension (requires superuser):
-- CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2) Add exclusion constraint on turnos table:
-- ALTER TABLE turnos
--   ADD CONSTRAINT turnos_no_overlap_exclusion
--   EXCLUDE USING GIST (
--     sala WITH =,
--     tstzrange(inicio, fin) WITH &&
--   );

-- To rollback (remove constraint):
-- ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_no_overlap_exclusion;
