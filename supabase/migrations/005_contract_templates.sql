-- ClearSign — Contract template provenance
-- Migration: 005_contract_templates.sql
--
-- Contracts now render from a fixed template per deal type (see
-- src/data/contractTemplates.js) instead of free-form AI generation.
-- These columns record which template + version produced a given
-- contract's text, for audit/display purposes (shown as small print on
-- the Contract screen). Additive and nullable — safe against existing rows.

alter table public.contracts add column if not exists template_id text;
alter table public.contracts add column if not exists template_version integer;
