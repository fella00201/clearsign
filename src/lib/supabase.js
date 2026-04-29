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
