<p align="center"><img src="assets/logo.svg" width="88" alt="Inkwell logo"></p>

<h1 align="center">Inkwell PDF Studio</h1>

Edit, sign and convert PDFs in the browser. Everything runs on the user's own device — files are never uploaded to a server.

## Features

- **Edit existing text in its original font** — click any line in a PDF and retype it. The font embedded in the PDF is reused on screen and in the saved file, with the same size, weight, colour and background, so edited lines match the rest of the document.
- **Edit scanned copies** — PDFs that are just scans or photos are detected automatically. **Make editable** recognises the text (OCR, in the browser) and adds it as an invisible layer, so the pages keep their exact original look while every line becomes clickable and editable. When you edit a scanned line, Inkwell matches the paper colour, ink colour, size, weight and the closest typeface (sans, serif or typewriter) by comparing letter shapes.
- **Fonts and weights** — a searchable font picker with the three standard PDF fonts plus 20 open-source families (sans, serif, slab, typewriter, condensed and handwriting, including Arial-, Times- and Courier-compatible fonts), each previewed in its own typeface. A weight slider uses each font's real weights (Thin to Black where available), and a Thickness slider adds extra boldness to any font, including the PDF's own. Fonts load on demand and are embedded in the saved PDF.
- **Automatic font detection** — clicking a line to edit it selects the matching font, size, weight and thickness automatically: the original embedded font when the PDF has one, otherwise the closest match found by comparing letter shapes.
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

## Brand assets

- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` — browser and home-screen icons (also embedded inside `index.html`, so the single file works on its own)
- `assets/logo.svg` — the logo mark; `assets/icon-192.png`, `assets/icon-512.png` — app icons used by `site.webmanifest`, which lets phones and Chrome install Inkwell like an app

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
- [fontkit](https://github.com/foliojs/fontkit) — re-embedding the PDF's own fonts
- [Tesseract.js](https://tesseract.projectnaptha.com/) — text recognition for scanned pages
- [Fontsource](https://fontsource.org/) via jsDelivr — open-source font files

## Known limits

- Whiteout and edited text hide the original visually, but the original text remains inside the file. Do not use whiteout to remove confidential information.
- Many PDFs embed only the characters they originally used. If you type a character that isn't in the embedded font (for example a `6` in a document that never used one), that character falls back to the closest standard font and Inkwell tells you which characters were affected. Fonts that aren't embedded at all use Helvetica, Times or Courier.
- New text boxes use the standard PDF fonts unless you click **Match nearby PDF text**, which switches them to the document's own font. Non-Latin scripts such as Arabic or Hindi are not supported in added text or in Word → PDF and appear as `?`.
- PDF → Word simplifies complex layouts (multi-column pages, positioned tables) into paragraphs. Run **Make editable** first if you want text from scanned pages in Word.
- Text recognition is English-only, needs an internet connection the first time (about 3 MB of language data) and runs on your device; it does not run inside the Claude preview. Accuracy depends on scan quality. Edited lines on a scan use the closest standard typeface and are placed straight, so on a tilted scan they can look very slightly level compared with the original.
- Library fonts cover Latin characters and need an internet connection the first time each is used; they can't load inside the Claude preview. Automatic detection picks the closest available font, not necessarily the document's exact typeface (for example Arial is matched as Helvetica or Arimo, and similar slab fonts can be swapped).
- Password-protected PDFs and legacy `.doc` files are not supported.
