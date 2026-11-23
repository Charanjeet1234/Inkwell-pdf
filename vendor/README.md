# Third-party libraries

Exact copies of the npm releases Inkwell uses, served from this site so the app keeps working when
jsDelivr is slow or blocked (some networks and ad-blockers block it). `index.html` checks each file
against its Subresource Integrity hash and falls back to the same version on jsDelivr if a file here
is missing.

| File | Package |
| --- | --- |
| pdf.min.js, pdf.worker.min.js | pdfjs-dist 3.11.174 (Apache-2.0) |
| pdf-lib.min.js | pdf-lib 1.17.1 (MIT) |
| fontkit.umd.min.js | @pdf-lib/fontkit 1.1.1 (MIT) |
| jszip.min.js | jszip 3.10.1 (MIT or GPL-3.0) |
| mammoth.browser.min.js | mammoth 1.6.0 (BSD-2-Clause) |
| supabase.js | @supabase/supabase-js 2.117.2 (MIT) |
| tesseract.min.js | tesseract.js 5.1.1 (Apache-2.0) |

To update a library, replace the file with the new release and update its `integrity` value and
version in `index.html`.
