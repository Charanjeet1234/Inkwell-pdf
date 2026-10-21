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

### Free during launch

Every feature above, including scan editing (OCR), automatic font detection, premium fonts, password protection and unlocking, true redaction, compression, form filling, batch processing, and stamps and templates, is free. Saved files have no watermark.

Saving or downloading needs a free account (email code or Google sign-in) once Supabase is connected (see below). Until then, everything works without an account.

### Branches

- **`main`**: this free edition. Deploy it to your live site.
- **`payments`**: the full paid version (Stripe checkout, Pro licences, owner admin page, Pro tools served only to licence holders). It is kept up to date with the sign-up feature and ready to merge when you introduce paid plans. Vercel builds it as a preview deployment, so you can test payments without touching the live site.

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

## Accounts: sign-up to save (Supabase)

1. **Create a project** at [supabase.com](https://supabase.com) (the free plan is enough to start).
2. **Connect your own email sender.** Supabase's built-in email only delivers to members of your Supabase team, at 2 emails an hour, so real users would never get their code. Go to **Authentication → Emails → SMTP Settings** and connect a provider such as Resend, Brevo, Postmark or Amazon SES using your own domain. Then raise the email limit under **Authentication → Rate Limits** (it starts at 30 an hour).
3. **Show the sign-in code in the emails.** Under **Authentication → Emails → Templates**, add this line to both **Confirm signup** and **Magic Link**:
   ```html
   <p>Your Inkwell code: <strong>{{ .Token }}</strong></p>
   ```
   Users can then type the 6-digit code without leaving their document (the link in the email works too).
4. **Allow your site's address.** Under **Authentication → URL Configuration**, set **Site URL** to your site (for example `https://pdf.example.com`) and add `https://pdf.example.com/**` to **Redirect URLs**.
5. **Google sign-in (optional, recommended).** Under **Authentication → Sign In / Providers → Google**, add a Google OAuth client ID and secret (from Google Cloud Console; add Supabase's callback URL shown there as an authorised redirect URI). Then set `SUPABASE_GOOGLE=true` in Vercel. Google sign-in sends no email, so it isn't affected by email limits.
6. **Vercel environment variables**, then redeploy:
   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | Project Settings → API → Project URL, e.g. `https://abcd1234.supabase.co` |
   | `SUPABASE_ANON_KEY` | Project Settings → API → the **anon / publishable** key (never the service-role or secret key) |
   | `SUPABASE_GOOGLE` *(optional)* | `true` after step 5 |
   | `SUPPORT_EMAIL` *(recommended)* | the address shown to users for help |

### Seeing how many people use Inkwell

- **Registered users:** Supabase → **Authentication → Users** shows every account and the total.
- **People who agreed to update emails:** Supabase → **SQL Editor**:
  ```sql
  select email, created_at from auth.users
  where raw_user_meta_data->>'updates' = 'true'
  order by created_at desc;
  ```
- **All visitors, including people who never sign up:** Vercel → **Analytics** (see below), which shows daily visitors, countries, devices and where they came from.

### Honest limits

The account check runs in the browser. It is there to count users and build your mailing list, not to protect anything secret, so a technical user could get around it. That is fine for a free product; real enforcement comes with the server-side checks in the `payments` branch.

## Usage statistics

The hosted site counts visitors anonymously with [Vercel Web Analytics](https://vercel.com/docs/analytics): no cookies, no personal data, and never any file names or file contents. It stays off when `index.html` is opened as a local file, on localhost and in the Claude preview.

**Turn it on (one time):** in the Vercel dashboard open this project → **Analytics** → **Enable**, then redeploy (or push any commit). After that, the Analytics tab shows:

- **Visitors and page views** per day, week or month
- **Countries and cities** visitors come from
- **Devices, operating systems and browsers**
- **Referrers** (which sites sent people here)

The app also sends anonymous feature events (`Open PDF`, `Save PDF`, `Convert`, `Signature`, `Edit text`, `Make scan editable`, `Pro tool`, `Sign-up prompt`, `Sign up`, `Sign in`) with at most a page-count range or method, never file details. Vercel only records these custom events on the Pro plan; on the free Hobby plan they're ignored and only visits are counted (50,000 events a month, 1-month reporting window).

## Website security

`vercel.json` sets a strict Content Security Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy. Third-party libraries load only from jsDelivr, pinned to exact versions with Subresource Integrity hashes; if you change a library version, update its `integrity` value too, or it will not load. Converted Word files are cleaned of scripts and unsafe links. Before launch, fill in the highlighted `[placeholder]` fields in `terms.html`, `privacy.html`, `security.html` and `.well-known/security.txt`.

## Built with

- [pdf.js](https://mozilla.github.io/pdf.js/) — rendering and text extraction
- [pdf-lib](https://pdf-lib.js.org/) — writing PDFs
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) — reading `.docx`
- [JSZip](https://stuk.github.io/jszip/) — packaging `.docx` and `.zip` files
- [fontkit](https://github.com/foliojs/fontkit) — re-embedding the PDF's own fonts
- [Tesseract.js](https://tesseract.projectnaptha.com/) — text recognition for scanned pages
- [Fontsource](https://fontsource.org/) via jsDelivr — open-source font files
- [@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) — AES-256 encryption and unlocking (loaded only when used, integrity-checked)
- [Supabase](https://supabase.com/) — free accounts (email code and Google sign-in)

## Known limits

- Whiteout and edited text hide the original visually, but the original text remains inside the file. Do not use whiteout to remove confidential information.
- Many PDFs embed only the characters they originally used. If you type a character that isn't in the embedded font (for example a `6` in a document that never used one), that character falls back to the closest standard font and Inkwell tells you which characters were affected. Fonts that aren't embedded at all use Helvetica, Times or Courier.
- New text boxes use the standard PDF fonts unless you click **Match nearby PDF text**, which switches them to the document's own font. Non-Latin scripts such as Arabic or Hindi are not supported in added text or in Word → PDF and appear as `?`.
- PDF → Word simplifies complex layouts (multi-column pages, positioned tables) into paragraphs. Run **Make editable** first if you want text from scanned pages in Word.
- Text recognition is English-only, needs an internet connection the first time (about 3 MB of language data) and runs on your device; it does not run inside the Claude preview. Accuracy depends on scan quality. Edited lines on a scan use the closest standard typeface and are placed straight, so on a tilted scan they can look very slightly level compared with the original.
- Library fonts cover Latin characters and need an internet connection the first time each is used; they can't load inside the Claude preview. Automatic detection picks the closest available font, not necessarily the document's exact typeface (for example Arial is matched as Helvetica or Arimo, and similar slab fonts can be swapped).
- Password-protected PDFs open after you enter the password. PDFs with owner restrictions (no open password, but editing disallowed by the author) can be viewed but not saved, to respect those restrictions. Legacy `.doc` files are not supported.
