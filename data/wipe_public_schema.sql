-- Wipe all objects in schema public (tables, views, migration history, etc.)
-- Run against your dev DB in DBeaver, then:
--   1) prisma migrate deploy   (or run rchq_db.sql)
--   2) run seed.sql
--
-- Requires permission to drop/create schema public and extensions.

DROP EXTENSION IF EXISTS unaccent CASCADE;

DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO CURRENT_USER;

CREATE EXTENSION IF NOT EXISTS unaccent;
