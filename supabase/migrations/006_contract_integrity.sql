-- ClearSign — Contract integrity guardrails
-- Migration: 006_contract_integrity.sql
--
-- RLS on public.contracts is currently "Anyone can update" (see
-- 003_contract_transition_policies.sql) because there's no real Supabase
-- Auth yet (auth.uid() is always null under the current localStorage-based
-- login) — so per-user permissions ("only the creator can set
-- creator_signed_at") can't be enforced at the RLS layer today. That's a
-- separate, larger follow-up once real auth exists.
--
-- What CAN be enforced without knowing who's asking: invariants about the
-- contract's own state. This migration adds a trigger so that, regardless
-- of which client or key is making the request:
--   1. A sealed contract can never be modified again, by anyone.
--   2. A contract can't be sealed unless both signatures are already present.
--   3. A signature, once set, can never be cleared or changed to a
--      different value (no un-signing, no backdating).
--   4. A contract can't have the same person as both parties.

create or replace function public.contracts_enforce_integrity()
returns trigger language plpgsql as $$
begin
  -- 1. Sealed = permanently frozen.
  if old.status = 'sealed' then
    raise exception 'Contract % is sealed and cannot be modified', old.id;
  end if;

  -- 2. Sealing requires both signatures to already be present in this same update.
  if new.status = 'sealed' and old.status is distinct from 'sealed' then
    if new.creator_signed_at is null or new.counterparty_signed_at is null then
      raise exception 'Contract % cannot be sealed without both signatures', old.id;
    end if;
  end if;

  -- 3. Signatures are append-only.
  if old.creator_signed_at is not null
     and (new.creator_signed_at is null or new.creator_signed_at <> old.creator_signed_at) then
    raise exception 'creator_signed_at cannot be changed once set';
  end if;

  if old.counterparty_signed_at is not null
     and (new.counterparty_signed_at is null or new.counterparty_signed_at <> old.counterparty_signed_at) then
    raise exception 'counterparty_signed_at cannot be changed once set';
  end if;

  return new;
end;
$$;

drop trigger if exists contracts_before_update_integrity on public.contracts;

create trigger contracts_before_update_integrity
  before update on public.contracts
  for each row execute function public.contracts_enforce_integrity();

-- 4. No self-dealing — can't be both parties in your own contract.
-- (Uses NOT VALID so an existing bad row, if any, doesn't block this
-- migration; run `validate constraint` separately once data is clean.)
alter table public.contracts
  drop constraint if exists contracts_no_self_dealing;

alter table public.contracts
  add constraint contracts_no_self_dealing
  check (creator_email <> counterparty_email) not valid;
