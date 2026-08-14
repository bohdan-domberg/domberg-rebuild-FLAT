/**
 * Default / starter data for a Windows/Structures cost-summary quote.
 * See HANDOFF.md §3. `pricePerM2: null` means flat-manual-total mode
 * (matches the real example, which has no price/m² column at all); filling
 * it in switches the Total to auto-computed (surfaceM2 × pricePerM2).
 */
export const defaultWindowsQuoteData = {
  quote_type: 'windows',

  coverImage: null,

  client: {
    name: '',
    project: '',
    address: '',
  },

  meta: {
    quoteNo: 'DE26-000',
    date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    validUntil: '',
  },

  system: '',
  surfaceM2: 0,
  pricePerM2: null,
  manualTotal: 0,
  showPricePerM2: true,

  includes: [],
  excludes: ['IVA', 'Mosquito Nets'],

  // Shop drawings / supporting PDFs, rasterized page-by-page on upload so
  // they can be appended as extra print pages — see pdfToImages.js.
  attachments: [],
};
