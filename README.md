# Inkwell PDF Studio

Edit, sign and convert PDFs in the browser. Everything runs on the user's own device — files are never uploaded to a server.

## Features

- **Edit existing text** — click any line in a PDF and retype it; size, colour and background are matched.
- **Text controls** — move added text with arrow buttons (0.5, 1 or 5 mm steps), type exact X/Y positions in mm, snap to page margins or centre, align text left/centre/right, and fade it from 0 to 100% opacity.
- **Match the document** — one click copies the font, size, weight and colour of the nearest PDF text; a colour picker samples any colour from the page.
- **Annotate** — text boxes, freehand drawing, highlights, whiteout, rectangles, ellipses, lines, arrows, images and dates. Everything can be moved, resized, restyled, duplicated or copied to all pages, with full undo/redo.
- **Sign** — draw, type or upload a signature and drag it into place. Signatures can be remembered on the device.
- **Pages** — rotate, delete, duplicate, reorder by drag and drop, add blank pages, merge other PDFs, extract or split pages.
- **Convert**
  - PDF → Word (`.docx`): editable text, or an exact-look copy with each page as a picture
  - PDF → images (PNG, 150 dpi) or plain text
  - Word (`.docx`) → PDF, with an editable preview first
  - Images → PDF
- **Extras** — watermark, page numbers, keyboard shortcuts, drag and drop, light and dark mode, works on phones.

## Run locally

It's a single file with no build step. Open `index.html` in Chrome, Edge or Firefox. An internet connection is needed the first time so the browser can load the PDF libraries from a CDN.

## Deploy

Any static host works — there is nothing to build.

- **Vercel:** import this repo, framework preset "Other", no build command, output directory `.` (root).
- **GitHub Pages:** Settings → Pages → deploy from branch `main`, folder `/ (root)`.
- **Netlify / Cloudflare Pages:** connect the repo, leave the build command empty, publish directory `/`.

## Built with

- [pdf.js](https://mozilla.github.io/pdf.js/) — rendering and text extraction
- [pdf-lib](https://pdf-lib.js.org/) — writing PDFs
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) — reading `.docx`
- [JSZip](https://stuk.github.io/jszip/) — packaging `.docx` and `.zip` files

## Known limits

- Whiteout and edited text hide the original visually, but the original text remains inside the file. Do not use whiteout to remove confidential information.
- Added text uses the standard PDF fonts (Helvetica, Times, Courier). Non-Latin scripts such as Arabic or Hindi are not supported in added text or in Word → PDF and appear as `?`.
- PDF → Word simplifies complex layouts (multi-column pages, positioned tables) into paragraphs. Scanned pages are kept as pictures; there is no OCR.
- Password-protected PDFs and legacy `.doc` files are not supported.
