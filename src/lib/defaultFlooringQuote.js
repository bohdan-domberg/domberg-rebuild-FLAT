/**
 * Default / starter data for a Hardwood/Flooring cost-summary quote.
 * See HANDOFF.md §2. Total is not a stored field — it's either the
 * auto-calculated surfaceM2 × pricePerM2, or a manually-typed override,
 * mirroring the manualOverride pattern already used for Standard-quote
 * pricing (defaultQuote.js `pricing`), scoped down to a single number.
 */
export const defaultFlooringQuoteData = {
  quote_type: 'flooring',

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

  material: '',
  surfaceM2: 0,
  pricePerM2: 0,
  showPricePerM2: true,

  pricing: {
    manualOverride: false,
    manualTotal: null,
  },

  includes: [
    'Delivery of flooring parket.',
    'Installation of flooring on concrete subfloor.',
    'Any materials required for the install of the parket.',
  ],
  excludes: ['IVA', 'Leveling of the subfloor.'],
  installAreas: [],

  // Shop drawings / supporting PDFs, rasterized page-by-page on upload so
  // they can be appended as extra print pages — see pdfToImages.js.
  attachments: [],
};
