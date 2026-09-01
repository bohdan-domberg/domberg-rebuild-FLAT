/**
 * Pure transform used by duplicateQuote(). No I/O — safe to unit-test.
 */

function formatQuoteDate(quoteType, date = new Date()) {
  if (quoteType === 'appliance') {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Deep-clones quote JSON and stamps a new reference + dates for a draft copy.
 */
export function prepareDuplicatedQuoteData(sourceData, { nextRef, quoteType, now = new Date() }) {
  const quoteData = structuredClone(sourceData || {});
  const type = quoteData.quote_type || quoteType || 'standard';

  quoteData.quote_type = type;
  quoteData.meta = { ...(quoteData.meta || {}) };

  if (type === 'standard') {
    quoteData.meta.reference = nextRef;
    quoteData.meta.version = 'v1';
    if (quoteData.cover && /^Ref:\s*/i.test(quoteData.cover.clientLine2 || '')) {
      quoteData.cover = { ...quoteData.cover, clientLine2: `Ref: ${nextRef}` };
    }
  } else {
    quoteData.meta.quoteNo = nextRef;
  }

  quoteData.meta.date = formatQuoteDate(type, now);
  if (Object.prototype.hasOwnProperty.call(quoteData.meta, 'validUntil')) {
    const until = new Date(now);
    until.setDate(until.getDate() + 30);
    quoteData.meta.validUntil = formatQuoteDate(type, until);
  }

  return quoteData;
}
