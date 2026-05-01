# Domberg Quote Generator

Web app for creating Domberg / NOMA Atelier bespoke joinery quotes. Renders
the same layout as the Jasmine HTML template, hosted on Netlify, edited in
the browser, printed to PDF via the browser's native print dialog.

## Stack
- React 19 + Vite 5
- Cormorant Garamond + DM Sans (via @fontsource)
- Native print → PDF (Chrome's "Save as PDF") — no JS PDF library
- Netlify for hosting (auto-deploy from `main`)

## Local dev
```bash
npm install
npm run dev
# → http://localhost:5173
```

## Build
```bash
npm run build
# Output → dist/
```

## Print → PDF
1. Click **Print to PDF** in the toolbar (or Ctrl/Cmd+P).
2. In Chrome's print dialog:
   - **Destination:** Save as PDF
   - **Layout:** Landscape (set automatically by `@page`)
   - **Margins:** None
   - **More settings → Background graphics:** ON
3. Save.

## Data shape (for AI fill-in)
The app's JSON schema lives in `src/lib/defaultQuote.js` — that file is the
single source of truth. Items support 3 image slots (`main`, `detail1`,
`detail2`) and arbitrary spec rows with editable labels.

## Roadmap
- **Phase 1 (this commit):** Faithful Jasmine layout, JSON import/export,
  print-to-PDF, local autosave.
- **Phase 2 (Supabase):** Auth, cloud quote storage, image storage (replaces
  base64 data URLs in JSON), quote list page.
- **Phase 3:** AI fill-in workflow polish — paste-from-Claude button, schema
  validation on import.

## License
© Domberg / NOMA Atelier. All rights reserved.
