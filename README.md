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

### Inkwell Pro (paid)

| Free | Pro |
| --- | --- |
| Edit text in the original font, annotate, sign, page tools, PDF ↔ Word, images, merge and split | Everything in Free, plus: |
| No watermark, no sign-up, no editing limits | |
| | Make scanned PDFs editable (OCR), automatic font/weight/size detection on scans |
| | 20 premium fonts and extra thickness control |
| | Password protect (AES-256) and open password-protected PDFs |
| | True redaction (redacted pages are rebuilt as images, so nothing underneath survives) |
| | Compress PDFs (balanced or maximum) |
| | Fill PDF form fields (saved filled and flattened) |
| | Batch: compress, watermark, page numbers, password-protect or merge many PDFs |
| | Stamps (Approved, Paid, Received…) and reusable templates |

Plans: monthly, yearly and lifetime, sold through Stripe Checkout (suggested prices $3 / month, $24 / year, $49 lifetime). A licence works on up to 3 devices at a time.

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

## Selling Inkwell Pro

Licensing runs in the Vercel functions in `api/`. There is no database: Stripe is the record of who has paid. Licence keys look like `INK-…` and are printed on the customer's Stripe invoices.

### Go-live checklist

1. **Stripe account.** Create and activate a Stripe account for your business (a UAE trade licence is required). Stripe reviews your website, so deploy first with the policy pages filled in (step 7).
2. **Product and prices.** Either create a product with three prices in the Stripe dashboard (monthly recurring, yearly recurring, one-time lifetime), or run:
   ```bash
   STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.js --currency usd --monthly 300 --yearly 2400 --lifetime 4900
   ```
   (amounts are in cents). It prints the three price IDs.
3. **Licence signing key and admin token.** Run `node scripts/generate-license-key.js` once. It prints `LICENSE_PRIVATE_KEY` and `ADMIN_TOKEN`. Keep both secret and never commit them. Changing the licence key later invalidates every issued licence key.
4. **Vercel environment variables** (Project → Settings → Environment Variables), then redeploy:
   | Variable | Value |
   | --- | --- |
   | `STRIPE_SECRET_KEY` | `sk_test_…` while testing, `sk_live_…` when live |
   | `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` / `STRIPE_PRICE_LIFETIME` | the price IDs from step 2 |
   | `LICENSE_PRIVATE_KEY` | the key from step 3 |
   | `ADMIN_TOKEN` | the admin token from step 3 (password for `/admin.html`) |
   | `SUPPORT_EMAIL` *(recommended)* | the address shown to customers for help |
   | `PUBLIC_URL` *(optional)* | your site address, e.g. `https://pdf.example.com` |
   | `STRIPE_AUTOMATIC_TAX` *(optional)* | `true` once Stripe Tax is set up |
   | `INKWELL_MAX_DEVICES` *(optional)* | devices per licence, default `3` |

   Until all five required variables are set, the app shows "Pro purchases are not switched on yet".
5. **Customer portal.** Stripe → Settings → Billing → Customer portal: save the default settings and allow cancelling, invoice history and switching between monthly and yearly. The **Manage billing** button opens it.
6. **Receipts.** Stripe → Settings → Customer emails: turn on emails for successful payments and invoices, so customers get their licence key by email.
7. **Policy pages.** Fill in every highlighted `[placeholder]` in `terms.html`, `privacy.html`, `refund.html`, `security.html` and `.well-known/security.txt` (company name, address, support email, governing law, refund days) and have them reviewed for your business.
8. **Test** with Stripe test mode and card `4242 4242 4242 4242`: buy each plan, check Pro activates, open **Manage billing**, cancel, and activate on a second browser with the licence key.
9. **Go live**: swap in your live secret key and live price IDs (run step 2 again with `sk_live_…`), then redeploy.

### Your own Pro account (owner access)

Open `https://<your-site>/admin.html`, paste your `ADMIN_TOKEN`, enter your email and click **Create licence**. You get a free lifetime licence key (default 5 devices). In Inkwell, click **Upgrade → Already bought Pro? Enter your licence key**. The same page can create free licences for staff or partners, look up a key, and revoke free or lifetime licences.

### Refunds and cancellations

- **Subscriptions:** refund in the Stripe dashboard *and cancel the subscription*; Pro switches off on that customer's next licence check (within a day).
- **Lifetime:** refund the payment in Stripe; the licence switches off automatically on the next check. Disputed payments are treated the same way.

### How Pro is protected

- **The Pro tools are not in the public app.** Their code lives in `api/_prokit.js`, which is never published as a static file. `/api/pro` sends it only to a browser holding a valid licence token signed with your private key, so flipping a switch in the browser does not unlock anything.
- **Licences are checked with Stripe on the server** and re-checked about once a day; cancelled, refunded or disputed purchases stop working. A licence works on a limited number of devices (rolling; the oldest is signed out).
- **Limits, honestly:** someone who has paid can capture the Pro code from their own browser and could, with real effort, rebuild it elsewhere. No browser-based app can prevent that entirely; this design stops casual unlocking and key sharing. Keep the repository private, never commit secrets, and rotate `ADMIN_TOKEN` if it leaks.

### Website security

`vercel.json` sets a strict Content Security Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy. Third-party libraries load only from jsDelivr, pinned to exact versions with Subresource Integrity hashes. If you change a library version, update its `integrity` value too, or it will not load.

Pro needs the website: the downloaded single file, `localhost` and the Claude preview always run the free version.

## Usage statistics

The hosted site counts visitors anonymously with [Vercel Web Analytics](https://vercel.com/docs/analytics): no cookies, no personal data, and never any file names or file contents. It stays off when `index.html` is opened as a local file, on localhost and in the Claude preview.

**Turn it on (one time):** in the Vercel dashboard open this project → **Analytics** → **Enable**, then redeploy (or push any commit). After that, the Analytics tab shows:

- **Visitors and page views** per day, week or month
- **Countries and cities** visitors come from
- **Devices, operating systems and browsers**
- **Referrers** (which sites sent people here)

The app also sends anonymous feature events (`Open PDF`, `Save PDF`, `Convert`, `Signature`, `Edit text`, `Make scan editable`, `Pro tool`, `Upgrade prompt`, `Checkout started`, `Pro activated`) with at most a page-count range or method, never file details. Vercel only records these custom events on the Pro plan; on the free Hobby plan they're ignored and only visits are counted (50,000 events a month, 1-month reporting window).

## Built with

- [pdf.js](https://mozilla.github.io/pdf.js/) — rendering and text extraction
- [pdf-lib](https://pdf-lib.js.org/) — writing PDFs
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) — reading `.docx`
- [JSZip](https://stuk.github.io/jszip/) — packaging `.docx` and `.zip` files
- [fontkit](https://github.com/foliojs/fontkit) — re-embedding the PDF's own fonts
- [Tesseract.js](https://tesseract.projectnaptha.com/) — text recognition for scanned pages
- [Fontsource](https://fontsource.org/) via jsDelivr — open-source font files
- [@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) — AES-256 encryption and unlocking (loaded only when used, integrity-checked)
- [Stripe](https://stripe.com/) — payments, subscriptions and the customer portal

## Known limits

- Whiteout and edited text hide the original visually, but the original text remains inside the file. Do not use whiteout to remove confidential information.
- Many PDFs embed only the characters they originally used. If you type a character that isn't in the embedded font (for example a `6` in a document that never used one), that character falls back to the closest standard font and Inkwell tells you which characters were affected. Fonts that aren't embedded at all use Helvetica, Times or Courier.
- New text boxes use the standard PDF fonts unless you click **Match nearby PDF text**, which switches them to the document's own font. Non-Latin scripts such as Arabic or Hindi are not supported in added text or in Word → PDF and appear as `?`.
- PDF → Word simplifies complex layouts (multi-column pages, positioned tables) into paragraphs. Run **Make editable** first if you want text from scanned pages in Word.
- Text recognition is English-only, needs an internet connection the first time (about 3 MB of language data) and runs on your device; it does not run inside the Claude preview. Accuracy depends on scan quality. Edited lines on a scan use the closest standard typeface and are placed straight, so on a tilted scan they can look very slightly level compared with the original.
- Library fonts cover Latin characters and need an internet connection the first time each is used; they can't load inside the Claude preview. Automatic detection picks the closest available font, not necessarily the document's exact typeface (for example Arial is matched as Helvetica or Arimo, and similar slab fonts can be swapped).
- Password-protected PDFs open with Pro after you enter the password. PDFs with owner restrictions (no open password, but editing disallowed by the author) can be viewed but not saved, to respect those restrictions. Legacy `.doc` files are not supported.
