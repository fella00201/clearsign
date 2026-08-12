import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Row → app shape ────────────────────────────────────────────────────────
// Supabase returns snake_case; the app uses camelCase + ownerName/Email/Color.
function mapRow(row) {
  // When a listing is JOINed with users via owner_id the related row lands
  // under the key "users" (PostgREST default for the referenced table name).
  const owner = row.users ?? {};
  return {
    id:              row.id,
    cat:             row.cat,
    subcat:          row.subcat,
    title:           row.title,
    location:        row.location,
    description:     row.description     ?? '',
    tags:            row.tags            ?? [],
    price_per_month: row.price_per_month ?? '',
    price_per_day:   row.price_per_day   ?? '',
    hourly_rate:     row.hourly_rate     ?? '',
    asking_price:    row.asking_price    ?? '',
    loan_amount:     row.loan_amount     ?? '',
    total_fee:       row.total_fee       ?? '',
    max_budget:      row.max_budget      ?? '',
    max_rate:        row.max_rate        ?? '',
    available_from:  row.available_from  ?? '',
    move_in:         row.move_in         ?? '',
    availability:    row.availability    ?? '',
    frequency:       row.frequency       ?? '',
    repay_by:        row.repay_by        ?? '',
    subject:         row.subject         ?? '',
    ownerName:       owner.name          ?? '',
    ownerEmail:      owner.email         ?? '',
    ownerColor:      owner.avatar_color  ?? '#5b8fff',
    ownerId:         row.owner_id        ?? null,
    bookingMarginDays: row.booking_margin_days ?? 0,
    blockedDates:    row.blocked_dates    ?? [],
    defaultOptions:  row.default_options   ?? {},
    reviewCount:     row.review_count    ?? 0,
    avgRating:       parseFloat(row.avg_rating) || 0,
    status:          row.status,
    createdAt:       row.created_at,
  };
}

// ── SELECT ─────────────────────────────────────────────────────────────────

/**
 * Fetch all active listings joined with the owner's user profile.
 * @returns {Promise<Array>}  listings in app shape, newest first
 */
export async function fetchListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      users!owner_id ( name, email, avatar_color )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/**
 * Fetch a single listing by UUID, joined with owner profile.
 * @param {string} id  UUID
 * @returns {Promise<Object>}  listing in app shape
 */
export async function fetchListingById(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      users!owner_id ( name, email, avatar_color )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapRow(data);
}

// ── INSERT ─────────────────────────────────────────────────────────────────

/**
 * Insert a listing into Supabase and return the saved row in app shape.
 * owner_id is only populated when the user signed up after the migration
 * (i.e. their id is a valid UUID stored in localStorage).
 *
 * @param {Object} listing  app-shaped listing object (ownerName, ownerId, …)
 * @returns {Promise<Object>}  saved listing in app shape (Supabase UUID as id)
 */
export async function insertListing(listing) {
  const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  const owner_id = UUID_RE.test(listing.ownerId ?? '') ? listing.ownerId : null;

  const { data, error } = await supabase
    .from('listings')
    .insert({
      cat:             listing.cat,
      subcat:          listing.subcat,
      title:           listing.title,
      location:        listing.location,
      description:     listing.description     || null,
      tags:            listing.tags            ?? [],
      price_per_month: listing.price_per_month || null,
      price_per_day:   listing.price_per_day   || null,
      hourly_rate:     listing.hourly_rate      || null,
      asking_price:    listing.asking_price     || null,
      loan_amount:     listing.loan_amount      || null,
      total_fee:       listing.total_fee        || null,
      max_budget:      listing.max_budget       || null,
      max_rate:        listing.max_rate         || null,
      available_from:  listing.available_from   || null,
      move_in:         listing.move_in          || null,
      availability:    listing.availability     || null,
      frequency:       listing.frequency        || null,
      repay_by:        listing.repay_by         || null,
      subject:         listing.subject          || null,
      booking_margin_days: listing.bookingMarginDays || 0,
      default_options: listing.defaultOptions  ?? {},
      owner_id,
      status: 'active',
    })
    .select(`
      *,
      users!owner_id ( name, email, avatar_color )
    `)
    .single();

  if (error) throw error;

  const result = mapRow(data);

  // If the JOIN returned no owner (owner_id was null), back-fill from the
  // local listing object so callers always get ownerName / ownerColor.
  if (!result.ownerName) {
    result.ownerName  = listing.ownerName  ?? '';
    result.ownerEmail = listing.ownerEmail ?? '';
    result.ownerColor = listing.ownerColor ?? '#5b8fff';
  }

  return result;
}

/**
 * Update a listing's booking settings (margin / owner-blocked dates).
 * Pass only the camelCase fields you want to change.
 * @param {string} id  Supabase UUID of the listing
 * @param {Object} updates  { bookingMarginDays?, blockedDates? }
 */
export async function updateListingRemote(id, updates) {
  const mapped = {};
  if (updates.bookingMarginDays !== undefined) mapped.booking_margin_days = updates.bookingMarginDays;
  if (updates.blockedDates      !== undefined) mapped.blocked_dates       = updates.blockedDates;

  const { error } = await supabase
    .from('listings')
    .update(mapped)
    .eq('id', id);

  if (error) throw error;
}

// ── Contracts ──────────────────────────────────────────────────────────────

/**
 * Map a contracts table row (snake_case) to the app's camelCase shape.
 * Sig image blobs are intentionally excluded — kept only in localStorage.
 */
function mapContractRow(row) {
  return {
    id:                   row.id,
    listingId:            row.listing_id            ?? null,
    listingTitle:         row.listing_title          ?? '',
    contractText:         row.contract_text          ?? '',
    templateId:           row.template_id            ?? null,
    templateVersion:      row.template_version        ?? null,
    termType:             row.term_type              ?? null,
    startDate:            row.start_date             ?? null,
    endDate:              row.end_date               ?? null,
    noticePeriodDays:     row.notice_period_days      ?? null,
    endedAt:              row.ended_at               ?? null,
    options:              row.options                ?? {},
    creatorName:          row.creator_name           ?? '',
    creatorEmail:         row.creator_email          ?? '',
    creatorColor:         row.creator_color          ?? '#5b8fff',
    creatorSignedAt:      row.creator_signed_at      ?? null,
    counterpartyName:     row.counterparty_name      ?? '',
    counterpartyEmail:    row.counterparty_email     ?? '',
    counterpartyColor:    row.counterparty_color     ?? '#5b8fff',
    counterpartySignedAt: row.counterparty_signed_at ?? null,
    status:               row.status,
    createdAt:            row.created_at,
    sealedAt:             row.sealed_at              ?? null,
    version:              row.version                ?? 1,
    previousOptions:      row.previous_options        ?? null,
    proposedByEmail:      row.proposed_by_email       ?? row.creator_email ?? '',
    proposedByName:       row.proposed_by_name        ?? row.creator_name  ?? '',
    revisedAt:            row.revised_at              ?? null,
  };
}

/**
 * Fetch all contracts where the given email is creator or counterparty.
 * @param {string} userEmail
 * @returns {Promise<Array>}  contracts in app shape, newest first
 */
export async function fetchContracts(userEmail) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .or(`creator_email.eq.${userEmail},counterparty_email.eq.${userEmail}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapContractRow);
}

/**
 * Fetch every contract for a listing, regardless of who the parties are —
 * used for the availability/collision check, which needs to see bookings
 * from other conversations about the same listing, not just the current
 * user's own contracts (unlike fetchContracts()).
 * @param {string} listingId
 * @returns {Promise<Array>}  contracts in app shape
 */
export async function fetchContractsByListing(listingId) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('listing_id', listingId);

  if (error) throw error;
  return (data ?? []).map(mapContractRow);
}

/**
 * Insert a new contract into Supabase and return the saved row.
 * Sig data (base64 PNGs) is intentionally not stored — stays in localStorage.
 *
 * @param {Object} doc  app-shaped contract doc
 * @returns {Promise<Object>}  saved contract in app shape (Supabase UUID as id)
 */
export async function insertContract(doc) {
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      listing_id:        doc.listingId        ?? null,
      listing_title:     doc.listingTitle      ?? '',
      contract_text:     doc.contractText      ?? '',
      template_id:       doc.templateId        ?? null,
      template_version:  doc.templateVersion   ?? null,
      term_type:         doc.termType          ?? null,
      start_date:        doc.startDate         ?? null,
      end_date:          doc.endDate           ?? null,
      notice_period_days: doc.noticePeriodDays ?? null,
      options:           doc.options           ?? {},
      creator_name:      doc.creatorName       ?? '',
      creator_email:     doc.creatorEmail      ?? '',
      creator_color:     doc.creatorColor      ?? '#5b8fff',
      counterparty_name:  doc.counterpartyName  ?? '',
      counterparty_email: doc.counterpartyEmail ?? '',
      counterparty_color: doc.counterpartyColor ?? '#5b8fff',
      status:            doc.status            ?? 'pending',
      version:           1,
      proposed_by_email: doc.creatorEmail      ?? '',
      proposed_by_name:  doc.creatorName       ?? '',
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapContractRow(data);
}

/**
 * Update a contract row (e.g. to record a signature or seal).
 * Pass only the camelCase fields you want to change; they are mapped to snake_case.
 *
 * @param {string} id      Supabase UUID of the contract
 * @param {Object} updates  camelCase fields to update
 */
export async function updateContract(id, updates) {
  const mapped = {};
  if (updates.status               !== undefined) mapped.status                 = updates.status;
  if (updates.creatorSignedAt      !== undefined) mapped.creator_signed_at      = updates.creatorSignedAt;
  if (updates.counterpartySignedAt !== undefined) mapped.counterparty_signed_at = updates.counterpartySignedAt;
  if (updates.sealedAt             !== undefined) mapped.sealed_at              = updates.sealedAt;
  if (updates.options              !== undefined) mapped.options                = updates.options;
  if (updates.previousOptions      !== undefined) mapped.previous_options       = updates.previousOptions;
  if (updates.contractText         !== undefined) mapped.contract_text          = updates.contractText;
  if (updates.templateId           !== undefined) mapped.template_id            = updates.templateId;
  if (updates.templateVersion      !== undefined) mapped.template_version       = updates.templateVersion;
  if (updates.version              !== undefined) mapped.version                = updates.version;
  if (updates.proposedByEmail      !== undefined) mapped.proposed_by_email      = updates.proposedByEmail;
  if (updates.proposedByName       !== undefined) mapped.proposed_by_name       = updates.proposedByName;
  if (updates.revisedAt            !== undefined) mapped.revised_at             = updates.revisedAt;
  if (updates.startDate            !== undefined) mapped.start_date             = updates.startDate;
  if (updates.endDate              !== undefined) mapped.end_date               = updates.endDate;
  if (updates.noticePeriodDays     !== undefined) mapped.notice_period_days     = updates.noticePeriodDays;

  const { error } = await supabase
    .from('contracts')
    .update(mapped)
    .eq('id', id);

  if (error) throw error;
}

// ── Threads & Messages ─────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function mapThreadRow(row) {
  return {
    id:           row.id,
    listingId:    row.listing_id    ?? null,
    listingTitle: row.listing_title ?? '',
    p1:           row.p1_email      ?? '',
    p1Name:       row.p1_name       ?? '',
    p1Color:      row.p1_color      ?? '#5b8fff',
    p2:           row.p2_email      ?? '',
    p2Name:       row.p2_name       ?? '',
    p2Color:      row.p2_color      ?? '#5b8fff',
    lastAt:       row.last_at,
    createdAt:    row.created_at,
  };
}

function mapMessageRow(row) {
  return {
    id:       row.id,
    threadId: row.thread_id,
    from:     row.from_email ?? '',
    fromName: row.from_name  ?? '',
    text:     row.text,
    read:     row.read       ?? false,
    at:       row.created_at,
  };
}

/**
 * Fetch all threads where the given email is p1 or p2, newest first.
 * @param {string} userEmail
 * @returns {Promise<Array>}
 */
export async function fetchThreads(userEmail) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .or(`p1_email.eq.${userEmail},p2_email.eq.${userEmail}`)
    .order('last_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapThreadRow);
}

/**
 * Fetch all of a user's threads (newest-activity first) with each thread's
 * unread count and last message attached, computed client-side from a
 * single messages query — avoids one round-trip per thread.
 * @param {string} userEmail
 * @returns {Promise<Array>}  threads with { unreadCount, lastMessage }
 */
export async function fetchThreadsWithUnread(userEmail) {
  const threads = await fetchThreads(userEmail);
  if (!threads.length) return threads;

  const threadIds = threads.map(t => t.id);
  const { data: msgs, error } = await supabase
    .from('messages')
    .select('thread_id, from_email, text, read, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const byThread = {};
  for (const m of msgs ?? []) {
    const bucket = byThread[m.thread_id] ?? (byThread[m.thread_id] = { unreadCount: 0, last: null });
    bucket.last = m; // ascending order — last write wins, ends up as the newest message
    if (!m.read && m.from_email !== userEmail) bucket.unreadCount++;
  }

  return threads
    .map(t => {
      const bucket = byThread[t.id];
      return {
        ...t,
        unreadCount: bucket?.unreadCount ?? 0,
        lastMessage: bucket?.last ? { from: bucket.last.from_email, text: bucket.last.text, at: bucket.last.created_at } : null,
      };
    })
    .sort((a, b) => new Date(b.lastMessage?.at || b.lastAt || b.createdAt) - new Date(a.lastMessage?.at || a.lastAt || a.createdAt));
}

/**
 * Fetch a single thread by UUID.
 * @param {string} threadId  Supabase UUID
 * @returns {Promise<Object>}
 */
export async function fetchThreadById(threadId) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('id', threadId)
    .single();
  if (error) throw error;
  return mapThreadRow(data);
}

/**
 * Find an existing thread for a listing between two participants.
 * Returns null if not found.
 * @param {string} listingId  UUID
 * @param {string} userEmail
 * @param {string} ownerEmail
 * @returns {Promise<Object|null>}
 */
export async function findThread(listingId, userEmail, ownerEmail) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('listing_id', listingId)
    .or(
      `and(p1_email.eq.${userEmail},p2_email.eq.${ownerEmail}),` +
      `and(p2_email.eq.${userEmail},p1_email.eq.${ownerEmail})`
    )
    .maybeSingle();
  if (error) throw error;
  return data ? mapThreadRow(data) : null;
}

/**
 * Insert a new thread and return the saved row.
 * @param {Object} thread  app-shaped thread object
 * @returns {Promise<Object>}
 */
export async function insertThread(thread) {
  const listing_id = UUID_RE.test(thread.listingId ?? '') ? thread.listingId : null;

  const { data, error } = await supabase
    .from('threads')
    .insert({
      id:            thread.id,
      listing_id,
      listing_title: thread.listingTitle || null,
      p1_id:         null,
      p1_email:      thread.p1      ?? '',
      p1_name:       thread.p1Name  ?? '',
      p1_color:      thread.p1Color ?? '#5b8fff',
      p2_id:         null,
      p2_email:      thread.p2      ?? '',
      p2_name:       thread.p2Name  ?? '',
      p2_color:      thread.p2Color ?? '#5b8fff',
      last_at:       new Date().toISOString(),
      created_at:    thread.createdAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapThreadRow(data);
}

/**
 * Fetch all messages for a thread, oldest first.
 * @param {string} threadId  Supabase UUID
 * @returns {Promise<Array>}
 */
export async function fetchMessages(threadId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessageRow);
}

/**
 * Insert a message and return the saved row.
 * @param {Object} message  app-shaped message object
 * @returns {Promise<Object>}
 */
export async function insertMessage(message) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id:  message.threadId,
      from_email: message.from     ?? '',
      from_name:  message.fromName ?? '',
      text:       message.text,
      read:       false,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMessageRow(data);
}

/**
 * Bump last_at on a thread to now (call after inserting a message).
 * @param {string} threadId  Supabase UUID
 */
export async function updateThreadLastAt(threadId) {
  const { error } = await supabase
    .from('threads')
    .update({ last_at: new Date().toISOString() })
    .eq('id', threadId);
  if (error) throw error;
}

/**
 * Count unread messages across all threads the user participates in,
 * excluding messages they sent themselves.
 * @param {string} userEmail
 * @returns {Promise<number>}
 */
export async function fetchUnreadMessageCount(userEmail) {
  const { data: threads, error: tErr } = await supabase
    .from('threads')
    .select('id')
    .or(`p1_email.eq.${userEmail},p2_email.eq.${userEmail}`);

  if (tErr || !threads?.length) return 0;

  const threadIds = threads.map(t => t.id);

  const { count, error: mErr } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('thread_id', threadIds)
    .eq('read', false)
    .neq('from_email', userEmail);

  if (mErr) return 0;
  return count ?? 0;
}
