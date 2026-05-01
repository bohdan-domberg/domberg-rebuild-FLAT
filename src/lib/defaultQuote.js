/**
 * Default / starter quote data.
 * Schema is the single source of truth for the entire app — the form, preview,
 * and JSON import/export all assume this shape.
 *
 *   cover      — left panel (project name, location, client) + cover image
 *   meta       — footer cells (date, version, lead time, validity, etc.)
 *   vatRate    — number, currently 21
 *   items[]    — schedule rows, each with 3 image slots + flexible spec rows
 *   terms[]    — array of {title, body} blocks for the terms page
 *   aboutPage  — optional brand page: { enabled, headline, blocks[], images[] }
 */
export const defaultQuoteData = {
  cover: {
    category: 'Commercial Proposal — Bespoke Joinery & Interiors',
    projectName: 'Project Name',
    location: 'Costa del Sol',
    clientLine1: 'Client — to confirm',
    clientLine2: 'Ref: PC26-000',
    coverImage: null,
  },

  meta: {
    date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    version: '1.0',
    reference: 'PC26-000',
    leadTime: '120 days',
    validity: '30 days',
    preparedBy: 'Inna · Domberg',
    contact: 'info@domberg.es',
  },

  vatRate: 21,

  // ── About page (toggle on/off per quote) ──────────────────────────────────
  aboutPage: {
    enabled: false,
    headline: 'Craftsmanship Since 1947',
    intro: 'Domberg is a family-run atelier established on the Costa del Sol in 1947. For more than seventy-five years we have designed, manufactured, and installed bespoke joinery and interiors for private residences, luxury developments, and commercial projects across southern Spain.',
    blocks: [
      {
        title: 'What We Do',
        body: 'We supply and install bespoke windows, doors, fitted kitchens, wardrobes, and full interior carpentry. Every piece is made to measure — drawn, crafted, and fitted by our own team. We do not subcontract production.',
      },
      {
        title: 'Materials & Specification',
        body: 'We work in solid hardwoods, engineered timber, lacquered MDF, sintered stone, and aluminium — always to the specification agreed with the client. Hardware is sourced from Häfele, Blum, and Hettich. All coatings use Milesi (Italy) systems for durability and colour consistency.',
      },
      {
        title: 'Installation',
        body: 'Our installation teams are employed directly by Domberg and work exclusively on our projects. Lead times are calculated from the date measurements are signed off — not from order placement — so we never begin production until we have a confirmed, accurate site survey.',
      },
      {
        title: 'After Care',
        body: 'All joinery carries a two-year workmanship guarantee. We offer annual service visits for hardware adjustment and surface touch-up. Our showroom in San Pedro de Alcántara holds spare hardware for every product line we have supplied in the past decade.',
      },
    ],
    // Two optional image slots
    images: [null, null],
  },

  items: [
    {
      id: 1,
      name: 'New Item',
      sub: '',
      specs: [
        { label: 'Dimensions', value: '' },
        { label: 'Materials', value: '' },
        { label: 'Hardware', value: '' },
      ],
      price: 0,
      qty: 1,
      images: { main: null, detail1: null, detail2: null },
    },
  ],

  terms: [
    {
      title: 'Offer Validity',
      body: 'This commercial offer is valid for thirty (30) days from the date of issue. For stone items, validity is seven (7) days (80% prepayment; 20% prior to shipment). After expiry, a full recalculation is required.',
    },
    {
      title: 'Production Lead Time',
      body: '120 calendar days from the date final measurements are taken, advance payment received, and materials, hardware, paint colours, signed specification and technical assignment approved by the client.',
    },
    {
      title: 'Preliminary Document',
      body: 'This offer is a preliminary document. Final documentation attached to the contract shall consist of the specification and technical assignment signed by both parties.',
    },
    {
      title: 'Cancellation & Advance Payment',
      body: 'If, after four (4) months from signing the specification, the client cancels part or all of the order, advance payments are non-refundable. Any shortfall must be settled within five (5) calendar days of invoice.',
    },
    {
      title: 'Colour Consistency',
      body: 'When items are reordered or replaced after a period of time, colour may differ from earlier production runs. Domberg accepts no liability for colour variation between batches.',
    },
    {
      title: 'Installation Notes',
      body: '<ul><li>Where access constraints prevent bringing large elements into the premises, constructions must be adjusted accordingly.</li><li>All items are finished using Milesi (Italy) coating systems.</li><li>Any excess material use identified following site measurement requires a revised cost proposal prior to production.</li></ul>',
    },
  ],
};
