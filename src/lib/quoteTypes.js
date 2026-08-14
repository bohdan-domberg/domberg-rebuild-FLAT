import { defaultQuoteData } from './defaultQuote';
import { defaultApplianceQuoteData } from './defaultApplianceQuote';
import { defaultFlooringQuoteData } from './defaultFlooringQuote';
import { defaultWindowsQuoteData } from './defaultWindowsQuote';

/**
 * Central registry for the 4 quote types. QuoteGenerator, the New-quote
 * picker, and HistoryDashboard all key off `quote_type` — this file is the
 * single place that knows how to get defaults, merge loaded/imported data
 * safely, decide whether a draft is worth restoring, and pick a display
 * name, for any given type.
 */
export const QUOTE_TYPES = [
  {
    id: 'standard',
    label: 'Standard',
    blurb: 'Bespoke joinery schedule — line items with specs and photos.',
  },
  {
    id: 'appliance',
    label: 'Appliance',
    blurb: 'Line-item appliance quote (Miele etc.) with a DOMBERG branding toggle.',
  },
  {
    id: 'flooring',
    label: 'Hardwood / Flooring',
    blurb: 'Cost-summary format: surface × price/m², includes/excludes, install areas.',
  },
  {
    id: 'windows',
    label: 'Windows / Structures',
    blurb: 'Cost-summary format: surface + total, includes/excludes.',
  },
];

const DEFAULTS_BY_TYPE = {
  standard: defaultQuoteData,
  appliance: defaultApplianceQuoteData,
  flooring: defaultFlooringQuoteData,
  windows: defaultWindowsQuoteData,
};

export function getDefaultQuoteData(type) {
  return DEFAULTS_BY_TYPE[type] || defaultQuoteData;
}

/**
 * Merges loaded/imported/restored data over the correct defaults for its
 * type, filling gaps for any nested object the schema relies on. The
 * 'standard' branch is a byte-for-byte port of the merge QuoteGenerator did
 * inline before this file existed — Standard-quote behavior is unchanged.
 */
export function mergeQuoteData(type, incoming) {
  const base = getDefaultQuoteData(type);
  const data = incoming || {};

  if (type === 'appliance') {
    return {
      ...base,
      ...data,
      client: { ...base.client, ...(data.client || {}) },
      meta: { ...base.meta, ...(data.meta || {}) },
      totals: { ...base.totals, ...(data.totals || {}) },
    };
  }

  if (type === 'flooring' || type === 'windows') {
    return {
      ...base,
      ...data,
      client: { ...base.client, ...(data.client || {}) },
      meta: { ...base.meta, ...(data.meta || {}) },
      ...(type === 'flooring'
        ? { pricing: { ...base.pricing, ...(data.pricing || {}) } }
        : {}),
    };
  }

  // 'standard' (and any unrecognised type falls back to it)
  return {
    ...base,
    ...data,
    aboutPage: { ...base.aboutPage, ...(data.aboutPage || {}) },
    pricing: { ...base.pricing, ...(data.pricing || {}) },
    cover: { ...base.cover, ...(data.cover || {}) },
    meta: { ...base.meta, ...(data.meta || {}) },
  };
}

/**
 * Whether a locally-autosaved draft differs meaningfully from a blank quote
 * of its type — used to decide whether to prompt "Restore your last unsaved
 * draft?". The 'standard' branch is the exact heuristic QuoteGenerator used
 * before (project name changed, or item count changed).
 */
export function isDraftMeaningful(type, parsed, base) {
  if (!parsed) return false;

  if (type === 'appliance') {
    return !!parsed.client?.name || (parsed.items || []).length > 0;
  }

  if (type === 'flooring' || type === 'windows') {
    return !!parsed.client?.project || Number(parsed.surfaceM2) > 0;
  }

  return (
    parsed.cover?.projectName !== base.cover.projectName ||
    (parsed.items || []).length !== base.items.length
  );
}

/** Project/quote name to use for export filenames etc, per type. */
export function getDisplayName(quoteData) {
  const type = quoteData?.quote_type || 'standard';
  if (type === 'standard') return quoteData?.cover?.projectName || 'quote';
  return quoteData?.client?.project || 'quote';
}
