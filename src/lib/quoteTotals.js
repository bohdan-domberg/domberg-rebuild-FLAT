import { defaultQuoteData } from './defaultQuote';

/**
 * computeStandardTotals — literal extraction of the totals block that used
 * to live inline in QuoteGenerator.jsx. Behavior is unchanged: manual
 * overrides win when enabled, otherwise everything is derived from
 * items[].price × qty, minus an optional discount, plus VAT.
 */
function computeStandardTotals(quoteData) {
  const rawSubtotal = quoteData.items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1),
    0
  );

  const pricing = quoteData.pricing || defaultQuoteData.pricing;
  const discountAmount = pricing.discountEnabled
    ? pricing.discountType === 'percent'
      ? (rawSubtotal * (Number(pricing.discountValue) || 0)) / 100
      : Number(pricing.discountValue) || 0
    : 0;
  const computedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const computedIva = (computedSubtotal * (Number(quoteData.vatRate) || 0)) / 100;
  const computedTotal = computedSubtotal + computedIva;

  const subtotal =
    pricing.manualOverride && pricing.manualSubtotal !== null && pricing.manualSubtotal !== ''
      ? Number(pricing.manualSubtotal)
      : computedSubtotal;
  const iva =
    pricing.manualOverride && pricing.manualIva !== null && pricing.manualIva !== ''
      ? Number(pricing.manualIva)
      : computedIva;
  const total =
    pricing.manualOverride && pricing.manualTotal !== null && pricing.manualTotal !== ''
      ? Number(pricing.manualTotal)
      : computedTotal;

  return {
    rawSubtotal,
    discountAmount: pricing.manualOverride ? 0 : discountAmount,
    discountLabel: pricing.discountLabel || 'Discount',
    subtotal,
    iva,
    total,
    vatEnabled: pricing.vatEnabled !== false,
  };
}

/**
 * computeApplianceTotals — a single global discount % applies to every
 * line (not per-item), VAT is a fixed 21%, matching appliance_quote.html.
 */
function computeApplianceTotals(quoteData) {
  const discountPct = Number(quoteData.discountPct) || 0;
  const rows = (quoteData.items || []).map((it) => {
    const listPrice = Number(it.listPrice) || 0;
    const qty = Number(it.qty) || 0;
    const net = listPrice * (1 - discountPct / 100);
    return { ...it, net, lineTotal: net * qty };
  });
  const subtotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const vat = subtotal * 0.21;
  return { rows, discountPct, subtotal, vat, grand: subtotal + vat };
}

/**
 * computeFlooringTotals — Total = surfaceM2 × pricePerM2 unless a manual
 * override is set (mirrors the Standard-quote manualOverride pattern,
 * scoped to one field).
 */
function computeFlooringTotals(quoteData) {
  const surfaceM2 = Number(quoteData.surfaceM2) || 0;
  const pricePerM2 = Number(quoteData.pricePerM2) || 0;
  const computed = surfaceM2 * pricePerM2;
  const pricing = quoteData.pricing || {};
  const total =
    pricing.manualOverride && pricing.manualTotal !== null && pricing.manualTotal !== ''
      ? Number(pricing.manualTotal)
      : computed;
  return { computed, total };
}

/**
 * computeWindowsTotals — Price/m² is optional. Filled in (>0), the total
 * auto-computes like Flooring; blank, Total is a flat manual entry.
 */
function computeWindowsTotals(quoteData) {
  const surfaceM2 = Number(quoteData.surfaceM2) || 0;
  const pricePerM2 =
    quoteData.pricePerM2 === null || quoteData.pricePerM2 === ''
      ? null
      : Number(quoteData.pricePerM2);
  const auto = pricePerM2 !== null && pricePerM2 > 0;
  const computed = auto ? surfaceM2 * pricePerM2 : 0;
  const total = auto ? computed : Number(quoteData.manualTotal) || 0;
  return { auto, computed, total };
}

export function computeTotals(quoteData) {
  const type = quoteData?.quote_type || 'standard';
  switch (type) {
    case 'appliance':
      return computeApplianceTotals(quoteData);
    case 'flooring':
      return computeFlooringTotals(quoteData);
    case 'windows':
      return computeWindowsTotals(quoteData);
    default:
      return computeStandardTotals(quoteData);
  }
}
