/**
 * Default / starter data for an Appliance quote.
 * Shape matches appliance_quote.html's copyJSON() output — the ported
 * React prototype (ApplianceForm/AppliancePreview) assumes this schema.
 *
 * `totals` is kept only so an exported JSON file matches the prototype's
 * shape; the app itself never reads it back in — totals are always
 * recomputed live via computeTotals() in quoteTotals.js.
 */
export const defaultApplianceQuoteData = {
  quote_type: 'appliance',
  branded: true,

  client: {
    name: '',
    project: '',
    address: '',
    email: '',
    phone: '',
    preparedBy: 'Bohdan',
  },

  meta: {
    quoteNo: 'DE26-000',
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    validUntil: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    })(),
  },

  discountPct: 0,

  items: [],

  totals: { subtotal: 0, vat: 0, grand: 0 },
};
