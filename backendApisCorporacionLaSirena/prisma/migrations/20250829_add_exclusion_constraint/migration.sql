-- NOTE: PostgreSQL-only SQL
-- This migration uses PostgreSQL features (CREATE EXTENSION, tstzrange, GIST, EXCLUDE).
-- It will NOT run on Microsoft SQL Server (T-SQL). If your editor shows "mssql" diagnostics
-- for this file, they are false positives — this file targets Postgres.
-- To avoid editor linter complaints in VS Code: open the Command Palette -> "Change Language Mode"
-- and select "SQL (PostgreSQL)" or temporarily disable the MSSQL extension for this workspace.

-- Enable btree_gist extension (superuser required)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping turnos in the same sala
ALTER TABLE turnos
  ADD CONSTRAINT turnos_no_overlap_exclusion
  EXCLUDE USING GIST (
    sala WITH =,
    tstzrange(inicio, fin) WITH &&
  );

-- Rollback example:
-- ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_no_overlap_exclusion;
