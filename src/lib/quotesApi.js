import { supabase } from './supabaseClient';

/**
 * Quotes are stored as a single jsonb `data` column matching the app's
 * existing quoteData shape (cover/meta/items/terms/aboutPage/vatRate).
 * quote_code and status are pulled out as real columns purely so the
 * history dashboard can filter/sort without querying inside the JSON.
 */

export async function listQuotes({ search = '', limit = 100 } = {}) {
  let query = supabase
    .from('quotes')
    .select('id, quote_code, status, quote_type, created_at, updated_at, data')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (search.trim()) {
    // Search across quote_code and inside the jsonb cover/meta blocks
    // (Standard) or client blocks (Appliance/Flooring/Windows).
    const term = search.trim();
    query = query.or(
      [
        `quote_code.ilike.%${term}%`,
        `data->cover->>projectName.ilike.%${term}%`,
        `data->cover->>clientLine1.ilike.%${term}%`,
        `data->meta->>reference.ilike.%${term}%`,
        `data->client->>name.ilike.%${term}%`,
        `data->client->>project.ilike.%${term}%`,
      ].join(',')
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load quotes: ${error.message}`);
  return data;
}

export async function loadQuote(id) {
  const { data, error } = await supabase
    .from('quotes')
    .select('id, quote_code, status, quote_type, data, created_at, updated_at')
    .eq('id', id)
    .single();
  if (error) throw new Error(`Could not load quote: ${error.message}`);
  return data;
}

/**
 * Upserts a quote. Pass an existing id to update, or omit it to create
 * a new row (returns the new id so the caller can remember it).
 */
export async function saveQuote({ id, quoteData, status = 'draft' }) {
  const quoteCode = quoteData?.meta?.reference || quoteData?.meta?.quoteNo || null;
  const quoteType = quoteData?.quote_type || 'standard';

  if (id) {
    const { error } = await supabase
      .from('quotes')
      .update({
        data: quoteData,
        quote_code: quoteCode,
        quote_type: quoteType,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw new Error(`Save failed: ${error.message}`);
    return id;
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({ data: quoteData, quote_code: quoteCode, quote_type: quoteType, status })
    .select('id')
    .single();
  if (error) throw new Error(`Save failed: ${error.message}`);
  return data.id;
}

export async function deleteQuote(id) {
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Looks at every saved quote_code matching DE26-### and returns the next
 * number in sequence, zero-padded to 3 digits (e.g. "DE26-014"). Falls back
 * to DE26-001 if nothing matches yet, and never throws — a lookup failure
 * just means no suggestion, which the caller can ignore.
 */
export async function getNextQuoteReference() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('quote_code')
      .ilike('quote_code', 'DE26-%');
    if (error) throw error;
    let maxNum = 0;
    (data || []).forEach((row) => {
      const match = /^DE26-(\d+)$/i.exec(row.quote_code || '');
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    });
    return `DE26-${String(maxNum + 1).padStart(3, '0')}`;
  } catch {
    return 'DE26-001';
  }
}
