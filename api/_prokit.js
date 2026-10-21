// Inkwell Pro tools.
// This file is never published as a static file: /api/pro sends its source to the browser
// only for a visitor holding a valid, signed Pro licence. Keep it inside api/ (files whose
// names start with "_" are bundled with the functions and are not served as pages).
'use strict';
module.exports = function inkwellProKit(K) {
  'use strict';
  const { $, $$, FAMILY_CSS, FONTS, LS_TPL, PDFDocument, PL, S, StandardFonts, TYPE_NAME, TextRenderingMode, addObj, allIdx, askPassword, baseName, bucket, buildBytes, buildPdfDoc, busy, clamp, cloneObj, concatTransformationMatrix, curPage, degrees, div, done, download, finishEdit, fmtSize, inViewer, insertPdfPages, jsPage, loadWebFont, ls, mctx, nearestW, objBox, openPdf, pageById, pageChars, popGraphicsState, pushGraphicsState, r2, renderTemplates, requirePro, rgb, sanitizer, select, setCharacterSqueeze, setDirty, setTextRenderingMode, setTool, tick, toast, track, uid, viewSize, viewer, visibleCenter, getBatchFiles } = K;

  const MATCH_FONTS = ['roboto', 'open-sans', 'merriweather', 'roboto-slab', 'arvo', 'courier-prime', 'roboto-condensed'];
  function preloadMatchFonts() { return Promise.race([Promise.allSettled(MATCH_FONTS.flatMap(id => [400, 700].map(w => loadWebFont(id, w, false)))), new Promise(r => setTimeout(r, 4000))]); }
  /* Guess the typeface of text that has no usable font (scans): draw the same words in each
     standard style, scaled to the original box, and keep the style whose letter shapes overlap
     the original pixels best. */
  async function guessFontFromPixels(pel, b, c) {
    try {
      if (!b.str || b.str.trim().length < 2) return null;
      const p = pageById(pel.dataset.id); if (!p || p.src < 0) return null; const { R } = viewSize(p);
      // render just this line from the PDF at high resolution (about 48 px per line)
      const s = clamp(48 / b.size, 2, 10);
      const X = Math.floor(b.x * s), Y = Math.floor((b.base - b.size * 1.7) * s);
      const w = Math.ceil(b.w * s), h = Math.ceil(b.size * 2.6 * s);
      if (w < 8 || h < 6 || w * h > 6e6) return null;
      const pg = await jsPage(p); const rc = document.createElement('canvas'); rc.width = w; rc.height = h;
      const rctx = rc.getContext('2d'); rctx.fillStyle = '#fff'; rctx.fillRect(0, 0, w, h);
      await pg.render({ canvasContext: rctx, viewport: pg.getViewport({ scale: s, rotation: R, offsetX: -X, offsetY: -Y }) }).promise;
      const src = rctx.getImageData(0, 0, w, h).data;
      { // keep only this line's band of ink, so lines above or below can't interfere
        const lumR = i => 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
        const hx0 = v => [1, 3, 5].map(k => parseInt(v.slice(k, k + 2), 16)); const bgc = hx0(c.bg), inc = hx0(c.ink);
        const t0 = ((0.299 * bgc[0] + 0.587 * bgc[1] + 0.114 * bgc[2]) + (0.299 * inc[0] + 0.587 * inc[1] + 0.114 * inc[2])) / 2;
        const rows = new Float32Array(h); for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < w; x++) if (lumR((y * w + x) * 4) < t0) n++; rows[y] = n; }
        const minInk = Math.max(1, w * 0.004);
        let r = Math.round((b.size * 1.7 - b.size * 0.3) * s); // inside the x-height of this line
        let best = -1; for (let d = 0; d < h; d++) { for (const rr of [r - d, r + d]) if (rr >= 0 && rr < h && rows[rr] >= minInk) { best = rr; break; } if (best >= 0) break; }
        if (best >= 0) {
          const gap = Math.max(2, Math.round(s * 0.6)); let top = best, bot = best, e = 0;
          for (let y = best - 1; y >= 0; y--) { if (rows[y] >= minInk) { top = y; e = 0; } else if (++e > gap) break; }
          e = 0; for (let y = best + 1; y < h; y++) { if (rows[y] >= minInk) { bot = y; e = 0; } else if (++e > gap) break; }
          for (let y = 0; y < h; y++) if (y < top - 1 || y > bot + 1) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; src[i] = bgc[0]; src[i + 1] = bgc[1]; src[i + 2] = bgc[2]; }
          rctx.putImageData(new ImageData(src, w, h), 0, 0);
        }
      }
      const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const hx = v => [1, 3, 5].map(k => parseInt(v.slice(k, k + 2), 16));
      const thr = (lum(hx(c.bg), 0) + lum(hx(c.ink), 0)) / 2;
      const A0 = new Uint8Array(w * h); let aCount = 0;
      for (let j = 0; j < w * h; j++) if (lum(src, j * 4) < thr) { A0[j] = 1; aCount++; }
      if (aCount < 10) return null;
      const dil = M0 => { const D = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const j = y * w + x; if (M0[j] || (x > 0 && M0[j - 1]) || (x < w - 1 && M0[j + 1]) || (y > 0 && M0[j - w]) || (y < h - 1 && M0[j + w])) D[j] = 1; } return D; };
      const median = arr => { if (!arr.length) return 0; const t = arr.slice().sort((p, q) => p - q); return t[t.length >> 1]; };
      // per-column ink extents: robust to tilt and to the odd descender
      const cols = M => { const out = []; for (let x = 0; x < w; x++) { let t = -1, bt = -1; for (let y = 0; y < h; y++) if (M[y * w + x]) { if (t < 0) t = y; bt = y; } if (t >= 0) out.push([x, t, bt]); } return out; };
      const fitSlope = cs => { let pts = cs.map(q => [q[0], q[2]]); for (let k = 0; k < 2; k++) { const n = pts.length; if (n < 4) return 0; const mx = pts.reduce((a, q) => a + q[0], 0) / n, my = pts.reduce((a, q) => a + q[1], 0) / n; let num = 0, den = 0; for (const q of pts) { num += (q[0] - mx) * (q[1] - my); den += (q[0] - mx) ** 2; } const sl = den ? num / den : 0; const res = pts.map(q => q[1] - (my + sl * (q[0] - mx))); const sd = Math.sqrt(res.reduce((a, r) => a + r * r, 0) / n) || 1; pts = pts.filter((q, i) => Math.abs(res[i]) <= Math.max(1.5, sd * 1.5)); if (k === 1) return sl; } return 0; };
      const ac = cols(A0); const slope = clamp(fitSlope(ac), -0.06, 0.06);
      const stat = cs => ({ hgt: median(cs.map(q => q[2] - q[1] + 1)), bot: median(cs.map(q => q[2] - slope * q[0])) });
      const sA = stat(ac); if (sA.hgt < 3) return null;
      const bgL = lum(hx(c.bg), 0), inkL = lum(hx(c.ink), 0); const D = new Float32Array(w * h); let sa = 0, saa = 0;
      const blurPx = clamp(s * 0.35, 0.8, 4);
      const bc2 = document.createElement('canvas'); bc2.width = w; bc2.height = h; const bx = bc2.getContext('2d', { willReadFrequently: true });
      bx.filter = `blur(${blurPx}px)`; bx.drawImage(rc, 0, 0); const srcB = bx.getImageData(0, 0, w, h).data;
      for (let j = 0; j < w * h; j++) { const v = clamp((bgL - lum(srcB, j * 4)) / Math.max(20, bgL - inkL), 0, 1); D[j] = v; sa += v; saa += v * v; }
      let inkScan = 0; for (let j = 0; j < w * h; j++) if (A0[j]) inkScan++;
      const off = document.createElement('canvas'); off.width = w; off.height = h; const ctx = off.getContext('2d', { willReadFrequently: true });
      const baseY = b.size * 1.7 * s; let best = null;
      const draw = (font, tf) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.setTransform(...tf); ctx.font = font; ctx.fillStyle = '#000'; ctx.textBaseline = 'alphabetic'; ctx.fillText(b.str, 0, baseY); const r = ctx.getImageData(0, 0, w, h).data; const M = new Uint8Array(w * h); for (let j = 0; j < w * h; j++) M[j] = r[j * 4 + 3] > 110 ? 1 : 0; return M; };
      const cands = [];
      for (const fam of ['sans', 'serif', 'mono']) for (const w of [400, 700]) cands.push({ fam, w, css: FAMILY_CSS[fam], std: true });
      for (const id of MATCH_FONTS) { const lib = FONTS[id]; for (const w0 of [400, 700]) { const w = nearestW(lib.w, w0); if (document.fonts.check(`${w} 20px "ink-wf-${id}"`) && !cands.some(c0 => c0.fam === 'wf:' + id && c0.w === w)) cands.push({ fam: 'wf:' + id, w, css: `"ink-wf-${id}"` }); } }
      for (const cand of cands) {
        const fam = cand.fam, bold = cand.w >= 600;
        const font = `${cand.w} ${b.size * s}px ${cand.css}`;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = font; const mw = ctx.measureText(b.str).width; if (!mw) continue;
        const kx = w / mw;
        const s1 = stat(cols(draw(font, [kx, 0, 0, 1, 0, 0]))); if (!s1.hgt) continue;
        const sy = sA.hgt / s1.hgt;
        const s2 = stat(cols(draw(font, [kx, slope, 0, sy, 0, 0])));
        const B0 = draw(font, [kx, slope, 0, sy, 0, sA.bot - s2.bot]);
        // final render, softened like the scan, compared by shading correlation (keeps thin serifs)
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.filter = `blur(${blurPx}px)`;
        ctx.setTransform(kx, slope, 0, sy, 0, sA.bot - s2.bot); ctx.font = font; ctx.fillText(b.str, 0, baseY); ctx.filter = 'none';
        const rr = ctx.getImageData(0, 0, w, h).data; let sb = 0, sbb = 0, sab = 0;
        for (let j = 0; j < w * h; j++) { const v = rr[j * 4 + 3] / 255; sb += v; sbb += v * v; sab += v * D[j]; }
        const N = w * h, cov = sab - sa * sb / N, va = saa - sa * sa / N, vb = sbb - sb * sb / N;
        const shape = va > 0 && vb > 0 ? cov / Math.sqrt(va * vb) : 0;
        const ratio = (mw * sy) / w;
        let inkCand = 0; for (let j = 0; j < w * h; j++) if (B0[j]) inkCand++;
        const weight = inkScan && inkCand ? Math.abs(Math.log(inkCand / inkScan)) : 1;
        const score = shape - 2 * Math.abs(Math.log(ratio)) - 0.8 * weight + (cand.std ? 0.03 : 0);
        if (!best || score > best.score) best = { fam, bold, w: cand.w, font, score, size: r2(b.size * sy), tf: [kx, slope, 0, sy, 0, sA.bot - s2.bot], inkCand };
      }
      if (best) { // extra stroke thickness for heavy or ink-bled print
        let bestB = 0, bestD = Math.abs(Math.log((best.inkCand || 1) / inkScan));
        for (const bo of [0.25, 0.5, 0.75, 1]) {
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.setTransform(...best.tf); ctx.font = best.font; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
          ctx.lineWidth = bo * b.size * 0.06 * s; ctx.lineJoin = 'round'; ctx.fillText(b.str, 0, baseY); ctx.strokeText(b.str, 0, baseY);
          const r = ctx.getImageData(0, 0, w, h).data; let n = 0; for (let j = 0; j < w * h; j++) if (r[j * 4 + 3] > 110) n++;
          const dd = Math.abs(Math.log(n / inkScan)); if (dd < bestD - 0.02) { bestD = dd; bestB = bo; }
        }
        best.boost = bestB;
      }
      return best;
    } catch (e) { console.warn(e); return null; }
  }

  const OCR_CFG = {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
    langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int'
  };

  let ocrWorker = null;
  async function getOcr(onProg) {
    if (typeof Tesseract === 'undefined') throw new Error('Text recognition did not load.');
    if (!ocrWorker) { window.__ocrLog = onProg; ocrWorker = await Tesseract.createWorker('eng', 1, { ...OCR_CFG, logger: m => window.__ocrLog && window.__ocrLog(m) }); }
    window.__ocrLog = onProg; return ocrWorker;
  }
  function chunksToItems(data, sc) {
    const items = [];
    for (const b of data.blocks || []) for (const par of b.paragraphs || []) for (const ln of par.lines || []) {
      const words = (ln.words || []).filter(w => w.text && w.text.trim() && w.confidence > 25);
      if (!words.length) continue;
      const bl = ln.baseline || {}; const hasBl = bl.has_baseline !== false && bl.x1 > bl.x0;
      const baseAt = x => hasBl ? bl.y0 + (bl.y1 - bl.y0) * (x - bl.x0) / (bl.x1 - bl.x0) : ln.bbox.y1;
      let cur = null;
      const flush = () => {
        if (!cur) return;
        const base = baseAt((cur.x0 + cur.x1) / 2);
        const capH = Math.max(1, base - cur.top);
        const size = capH / 0.78;
        items.push({ text: cur.words.join(' '), x: cur.x0 / sc, w: (cur.x1 - cur.x0) / sc, base: base / sc, size: size / sc, conf: cur.conf / cur.words.length });
        cur = null;
      };
      for (const w of words) {
        const hgt = w.bbox.y1 - w.bbox.y0;
        if (cur && (w.bbox.x0 - cur.x1) > Math.max(hgt, cur.h) * 1.6) flush();
        if (!cur) cur = { words: [], x0: w.bbox.x0, x1: w.bbox.x1, top: w.bbox.y0, h: hgt, conf: 0 };
        cur.words.push(w.text); cur.x1 = Math.max(cur.x1, w.bbox.x1); cur.top = Math.min(cur.top, w.bbox.y0); cur.h = Math.max(cur.h, hgt); cur.conf += w.confidence;
      }
      flush();
    }
    return items;
  }
  async function makeEditable(fromMenu) {
    if (!S.open) return; if (!requirePro('ocr')) return; finishEdit();
    const todo = [];
    busy('Checking pages…');
    for (let i = 0; i < S.pages.length; i++) { const p = S.pages[i]; if (p.src >= 0 && (await pageChars(p)) < 15) todo.push(i); }
    if (!todo.length) { done(); return toast(fromMenu ? 'This document already has editable text on every page.' : 'No scanned pages found.', false, 3500); }
    const results = {};
    try {
      busy('Loading text recognition…');
      let pageNo = 0;
      const worker = await getOcr(m => { if (m.status === 'recognizing text') busy(`Recognising text · page ${pageNo} of ${todo.length} · ${Math.round((m.progress || 0) * 100)}%`); else if (/load|initiali/i.test(m.status || '')) busy('Loading text recognition…'); });
      for (const i of todo) {
        pageNo++; busy(`Recognising text · page ${pageNo} of ${todo.length}`);
        const p = S.pages[i]; const { W, H, R } = viewSize(p);
        const sc = clamp(2600 / Math.max(W, H), 1.5, 4);
        const pg = await jsPage(p); const vp = pg.getViewport({ scale: sc, rotation: R });
        const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: ctx, viewport: vp }).promise;
        const { data } = await worker.recognize(c, {}, { blocks: true, text: false, hocr: false, tsv: false });
        results[i] = chunksToItems(data, sc);
      }
    } catch (e) {
      console.error(e); done();
      return toast(inViewer ? 'Text recognition can\'t run inside this preview. Open Inkwell from your website or the downloaded file to make scans editable.' : 'Text recognition could not load. Check your internet connection and try again.', true, 7000);
    }
    const total = Object.values(results).reduce((n, a) => n + a.length, 0);
    if (!total) { done(); return toast('No readable text was found on the scanned pages.', true, 5000); }
    try {
      const doc = await buildPdfDoc(allIdx(), (n, N) => busy(`Building editable PDF · page ${n + 1} of ${N}`), async (idx, page, W, H, F, safe) => {
        const items = results[idx]; if (!items || !items.length) return;
        const font = await F('Helvetica');
        page.pushOperators(setTextRenderingMode(TextRenderingMode.Invisible));
        for (const it of items) {
          const t = safe(it.text); if (!t.trim()) continue;
          const tw = font.widthOfTextAtSize(t, it.size); if (!tw) continue;
          page.pushOperators(setCharacterSqueeze(clamp(100 * it.w / tw, 20, 500)));
          page.drawText(t, { x: it.x, y: H - it.base, size: it.size, font });
        }
        page.pushOperators(setCharacterSqueeze(100), setTextRenderingMode(TextRenderingMode.Fill));
      });
      busy('Finishing…'); const bytes = await doc.save(); const name = S.name; done();
      await openPdf(bytes, name); setDirty(true);
      $('#scanBar').hidden = true; $('.work').classList.remove('has-scan');
      setTool('edittext'); track('Make scan editable', { pages: bucket(todo.length) });
      const conf = Object.values(results).flat(); const avg = conf.reduce((a, b) => a + b.conf, 0) / conf.length;
      toast(`Recognised ${total} lines on ${todo.length} page${todo.length > 1 ? 's' : ''}. Click any line to edit it.${avg < 70 ? ' The scan is blurry, so check edited text carefully.' : ''}`, false, 6000);
    } catch (e) { console.error(e); done(); toast('Could not build the editable PDF: ' + (e.message || e), true, 6000); }
  }


  let encLib = null;
  function loadEncLib() {
    if (encLib) return encLib;
    encLib = new Promise((res, rej) => {
      const keep = window.PDFLib; const sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.11.1/dist/pdf-lib.min.js'; sc.integrity = 'sha384-BcRbGROz3cx4LSKcOw2L5YxAxiJPWIEmXRMrYbXu87aSiU5uMQ4qB9v8FEjrBhhq'; sc.crossOrigin = 'anonymous';
      sc.onload = () => { const lib = window.PDFLib; window.PDFLib = keep; lib && lib !== keep && lib.PDFDocument ? res(lib) : rej(new Error('The encryption library did not load.')); };
      sc.onerror = () => { window.PDFLib = keep; encLib = null; rej(new Error('Could not load the encryption library. Check your internet connection.')); };
      document.head.append(sc);
    });
    return encLib;
  }

  async function encryptBytes(bytes, pw, perm) {
    const C = await loadEncLib(); const d = await C.PDFDocument.load(bytes, { updateMetadata: false });
    const owner = [...crypto.getRandomValues(new Uint8Array(18))].map(b => b.toString(16).padStart(2, '0')).join('');
    d.encrypt({ userPassword: pw, ownerPassword: owner, permissions: { printing: perm.printing ? 'highResolution' : false, copying: !!perm.copying, modifying: !!perm.editing, annotating: !!perm.editing, fillingForms: !!perm.editing, documentAssembly: !!perm.editing, contentAccessibility: true } });
    return d.save();
  }


  async function unlockAndOpen(bytes, name, at, err) {
    if (!requirePro('unlock')) return;
    const pw = await askPassword(name, err); if (pw == null) return;
    busy('Unlocking…');
    try {
      const C = await loadEncLib();
      const d = await C.PDFDocument.load(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), { password: pw, updateMetadata: false });
      const plain = await d.save(); done();
      if (at === false) await openPdf(plain, name); else await insertPdfPages(plain, at);
      toast('Unlocked. Copies you save won\'t need a password unless you protect them again.', false, 5000); track('Pro tool', { tool: 'unlock' });
    } catch (e) {
      done();
      if (/password/i.test(e.message)) return unlockAndOpen(bytes, name, at, 'That password is not correct. Try again.');
      toast('Could not unlock this PDF: ' + e.message, true, 6000);
    }
  }


  async function protectAndSave(a, perm) {
    try {
      busy('Protecting…'); const bytes = await buildBytes(allIdx(), 'Protecting'); busy('Encrypting…');
      const out = await encryptBytes(bytes, a, perm);
      if (await download(out, baseName() + '-protected.pdf', 'application/pdf')) { toast('Saved a password-protected copy (AES-256).'); track('Pro tool', { tool: 'protect' }); }
    } catch (e) { console.error(e); toast('Could not protect the PDF: ' + e.message, true, 6000); } finally { done(); }
  }

  // Undo simple wrapper encodings some PDF makers put around JPEG data.
  const PRE_FILTERS = {
    '/ASCII85Decode': u8 => { const s = new TextDecoder('latin1').decode(u8).replace(/\s+/g, '').replace(/^<~/, '').replace(/~>.*$/, ''); const out = []; let g = [];
      for (const ch of s) { if (ch === 'z' && !g.length) { out.push(0, 0, 0, 0); continue; } g.push(ch.charCodeAt(0) - 33); if (g.length === 5) { let n = 0; for (const v of g) n = n * 85 + v; out.push(n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255); g = []; } }
      if (g.length) { const k = g.length; while (g.length < 5) g.push(84); let n = 0; for (const v of g) n = n * 85 + v; const b4 = [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255]; out.push(...b4.slice(0, k - 1)); }
      return new Uint8Array(out); },
    '/ASCIIHexDecode': u8 => { const s = new TextDecoder('latin1').decode(u8).replace(/[^0-9a-fA-F]/g, ''); const out = new Uint8Array(Math.ceil(s.length / 2)); for (let i = 0; i < out.length; i++) out[i] = parseInt((s.substr(i * 2, 2) + '0').slice(0, 2), 16); return out; },
    '/FlateDecode': async u8 => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer())
  };
  async function recompressImages(doc, { quality = 0.62, maxDim = 1800 } = {}) {
    const { PDFRawStream, PDFName, PDFNumber, PDFArray } = PL; const N = n => PDFName.of(n); let saved = 0, count = 0;
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFRawStream)) continue; const d = obj.dict;
      if (d.get(N('Subtype')) !== N('Image')) continue;
      let filt = d.get(N('Filter')), pre = [];
      if (filt instanceof PDFArray) { const all = filt.asArray(); filt = all[all.length - 1]; pre = all.slice(0, -1).map(x => x.asString ? x.asString() : String(x)); }
      if (filt !== N('DCTDecode') || d.get(N('Decode')) || d.get(N('ImageMask')) || d.get(N('Mask'))) continue;
      if (pre.some(x => !PRE_FILTERS[x])) continue;
      const cs = d.lookup(N('ColorSpace'));
      if (cs === N('DeviceCMYK')) continue;
      if (cs instanceof PDFArray) {
        const kind = cs.get(0);
        if (kind === N('ICCBased')) { const icc = cs.lookup(1); const n = icc && icc.dict && icc.dict.get(N('N')); if (n && n.asNumber() === 4) continue; }
        else if (kind !== N('CalRGB') && kind !== N('CalGray')) continue;
      }
      const stored = obj.contents; if (stored.length < 20000) continue;
      let bytes = stored; try { for (const fn of pre) bytes = await PRE_FILTERS[fn](bytes); } catch { continue; }
      let bmp; try { bmp = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' })); } catch { continue; }
      const sc = d.get(N('SMask')) ? 1 : Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * sc)), h = Math.max(1, Math.round(bmp.height * sc));
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h); if (bmp.close) bmp.close();
      const nb = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', quality))).arrayBuffer());
      if (nb.length >= stored.length * 0.9) continue;
      d.set(N('Width'), PDFNumber.of(w)); d.set(N('Height'), PDFNumber.of(h)); d.set(N('ColorSpace'), N('DeviceRGB')); d.set(N('BitsPerComponent'), PDFNumber.of(8)); d.delete(N('DecodeParms')); d.set(N('Filter'), N('DCTDecode'));
      doc.context.assign(ref, PDFRawStream.of(d, nb)); saved += stored.length - nb.length; count++;
    }
    return { saved, count };
  }
  async function rasterizeBytes(bytes, dpi, quality, onPage) {
    const js = await pdfjsLib.getDocument({ data: bytes.slice() }).promise; const out = await PDFDocument.create();
    for (let i = 1; i <= js.numPages; i++) {
      if (onPage) onPage(i, js.numPages);
      const pg = await js.getPage(i); const v1 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: dpi / 72 });
      const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height); const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: x, viewport: vp, annotationMode: pdfjsLib.AnnotationMode.ENABLE }).promise;
      const jpg = new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', quality))).arrayBuffer());
      const img = await out.embedJpg(jpg); out.addPage([v1.width, v1.height]).drawImage(img, { x: 0, y: 0, width: v1.width, height: v1.height });
    }
    js.destroy(); return out.save({ useObjectStreams: true });
  }

  async function compressAndSave(mode) {
    try {
      const doc = await buildPdfDoc(allIdx(), (n, T) => busy(`Preparing · page ${n + 1} of ${T}`));
      busy('Measuring…'); const before = await doc.save(); let out;
      if (mode === 'strong') out = await rasterizeBytes(before, 110, 0.55, (i, T) => busy(`Compressing · page ${i} of ${T}`));
      else { busy('Compressing images…'); await recompressImages(doc); busy('Finishing…'); out = await doc.save({ useObjectStreams: true }); }
      done();
      if (out.length >= before.length * 0.97) { toast('This PDF is already compact, so there was nothing worth reducing.', false, 5000); return; }
      const pct = Math.round((1 - out.length / before.length) * 100);
      if (await download(out, baseName() + '-compressed.pdf', 'application/pdf')) { toast(`Compressed from ${fmtSize(before.length)} to ${fmtSize(out.length)} (${pct}% smaller).`, false, 6000); track('Pro tool', { tool: 'compress', mode }); }
    } catch (e) { console.error(e); toast('Could not compress: ' + e.message, true, 6000); } finally { done(); }
  }

  async function flattenPageJpeg(p) {
    const { W, H, R } = viewSize(p); const sc = 200 / 72;
    const c = document.createElement('canvas'); c.width = Math.ceil(W * sc); c.height = Math.ceil(H * sc);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    if (p.src >= 0) { const pg = await jsPage(p); await pg.render({ canvasContext: x, viewport: pg.getViewport({ scale: sc, rotation: R }), annotationMode: pdfjsLib.AnnotationMode.ENABLE }).promise; }
    x.fillStyle = '#000';
    for (const o of p.objs) if (o.t === 'redact') x.fillRect(Math.floor(o.x * sc) - 1, Math.floor(o.y * sc) - 1, Math.ceil(o.w * sc) + 2, Math.ceil(o.h * sc) + 2);
    return new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9))).arrayBuffer());
  }


  async function buildFormLayer(el) {
    const p = pageById(el.dataset.id); if (!p || p.src < 0) return;
    let fl = el.querySelector('.fl'); if (!fl) { fl = div('fl'); el.append(fl); }
    const key = `${p.src}:${p.idx}:${p.rot}:${S.zoom}`; if (fl._key === key) return; fl._key = key; fl.innerHTML = '';
    const an = (S.fields[p.src] || {})[p.idx]; if (!an) return;
    const pg = await jsPage(p); const { R } = viewSize(p); const vp = pg.getViewport({ scale: S.zoom, rotation: R });
    const vals = S.forms[p.src] = S.forms[p.src] || {};
    for (const a of an) {
      const [x1, y1, x2, y2] = vp.convertToViewportRectangle(a.rect);
      const L = Math.min(x1, x2), T = Math.min(y1, y2), Wd = Math.abs(x2 - x1), Ht = Math.abs(y2 - y1);
      let inp;
      if (a.fieldType === 'Tx') {
        inp = document.createElement(a.multiLine ? 'textarea' : 'input'); if (!a.multiLine) inp.type = 'text';
        inp.value = vals[a.fieldName] ?? (a.fieldValue || ''); if (a.maxLen) inp.maxLength = a.maxLen;
        inp.style.fontSize = Math.max(8, Math.min(Ht * 0.72, a.textSize ? a.textSize * S.zoom : Ht * 0.62)) + 'px';
        inp.oninput = () => { vals[a.fieldName] = inp.value; $$('.fld', viewer).forEach(x => { if (x !== inp && x.dataset.field === a.fieldName && x.tagName === inp.tagName) x.value = inp.value; }); setDirty(); };
      } else if (a.fieldType === 'Btn' && a.checkBox) {
        inp = document.createElement('input'); inp.type = 'checkbox';
        const v = vals[a.fieldName]; inp.checked = v !== undefined ? !!v : !!(a.fieldValue && a.fieldValue !== 'Off');
        inp.onchange = () => { vals[a.fieldName] = inp.checked; setDirty(); };
      } else if (a.fieldType === 'Btn' && a.radioButton) {
        inp = document.createElement('input'); inp.type = 'radio'; inp.name = `r${p.src}_${a.fieldName}`;
        inp.checked = (vals[a.fieldName] ?? a.fieldValue) === a.buttonValue;
        inp.onchange = () => { if (inp.checked) { vals[a.fieldName] = a.buttonValue; setDirty(); } };
      } else if (a.fieldType === 'Ch') {
        inp = document.createElement('select');
        for (const o of a.options || []) { const op = document.createElement('option'); op.value = o.exportValue ?? o.displayValue; op.textContent = o.displayValue ?? o.exportValue; inp.append(op); }
        const cur = vals[a.fieldName] ?? (Array.isArray(a.fieldValue) ? a.fieldValue[0] : a.fieldValue); if (cur != null) inp.value = cur;
        inp.style.fontSize = Math.max(8, Ht * 0.6) + 'px';
        inp.onchange = () => { vals[a.fieldName] = inp.value; setDirty(); };
      } else continue;
      inp.className = 'fld'; inp.dataset.field = a.fieldName; if (a.readOnly) inp.disabled = true;
      inp.setAttribute('aria-label', a.alternativeText || a.fieldName);
      Object.assign(inp.style, { left: L + 'px', top: T + 'px', width: Wd + 'px', height: Ht + 'px' });
      if (inp.type === 'checkbox' || inp.type === 'radio') { const m = Math.min(Wd, Ht); Object.assign(inp.style, { width: m + 'px', height: m + 'px', left: L + (Wd - m) / 2 + 'px', top: T + (Ht - m) / 2 + 'px' }); }
      ['pointerdown', 'mousedown', 'dblclick'].forEach(ev => inp.addEventListener(ev, e => e.stopPropagation()));
      fl.append(inp);
    }
  }
  function applyFormValues(sd, src) {
    const vals = S.forms[src]; if (!vals || !Object.keys(vals).length) return;
    try {
      const form = sd.getForm();
      for (const [name, v] of Object.entries(vals)) {
        let f; try { f = form.getField(name); } catch { continue; }
        try {
          if (f instanceof PL.PDFTextField) f.setText(String(v ?? ''));
          else if (f instanceof PL.PDFCheckBox) { if (v) f.check(); else f.uncheck(); }
          else if (f instanceof PL.PDFRadioGroup) { if (v && v !== 'Off') f.select(String(v)); }
          else if (f instanceof PL.PDFDropdown || f instanceof PL.PDFOptionList) { if (v != null && v !== '') f.select(String(v)); }
        } catch (e) { console.warn('Form field', name, e); }
      }
      form.flatten();
    } catch (e) { console.warn(e); toast('Some form fields could not be filled in the saved copy.', true, 5000); }
  }


  function placeStamp(text, color) {
    const p = curPage(); if (!p) return; const { W, H } = viewSize(p); const c = visibleCenter(p);
    const sub = $('#stDate').checked ? new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const h = sub ? 56 : 46; mctx.font = '700 100px Helvetica, Arial, sans-serif';
    const fs = h * (sub ? 0.36 : 0.5); const w = clamp(mctx.measureText(text).width * 1.06 * fs / 100 / 0.84 + 8, 90, W * 0.8);
    const o = { id: uid(), t: 'stamp', x: clamp(c.x - w / 2, 0, W - w), y: clamp(c.y - h / 2, 0, H - h), w, h, text, sub, color, op: 0.9 };
    $('#dlgStamps').close(); if (S.tool !== 'select') setTool('select'); addObj(o, p); select(o, p); track('Pro tool', { tool: 'stamp' });
  }

  function saveTemplate(o) {
    if (!requirePro('templates')) return;
    const name = o.t === 'text' ? o.text.split('\n')[0].slice(0, 40) : o.t === 'stamp' ? `Stamp: ${o.text}` : o.t === 'image' ? (o.kind === 'sign' ? 'Signature' : 'Image') + ' ' + new Date().toLocaleDateString() : TYPE_NAME[o.t] || 'Item';
    const item = { id: uid(), name, obj: JSON.parse(JSON.stringify(o)), asset: o.t === 'image' ? S.assets[o.asset] : null };
    const list = ls.get(LS_TPL, []); list.unshift(item);
    if (!ls.set(LS_TPL, list.slice(0, 40))) return toast('Template storage on this device is full. Delete an old template first.', true, 5000);
    toast(`Saved "${name}" to My templates.`); track('Pro tool', { tool: 'template' });
  }

  function templateClick(e) {
    const list = ls.get(LS_TPL, []);
    const del = e.target.closest('[data-tpldel]'); if (del) { list.splice(+del.dataset.tpldel, 1); ls.set(LS_TPL, list); renderTemplates(); return; }
    const b = e.target.closest('[data-tpl]'); if (!b) return; const t = list[+b.dataset.tpl]; const p = curPage(); if (!t || !p) return;
    let o = JSON.parse(JSON.stringify(t.obj));
    if (t.asset) { const aid = uid(); S.assets[aid] = t.asset; o.asset = aid; }
    const bx = objBox(o), c = visibleCenter(p); o = cloneObj(o, c.x - (bx.x + bx.w / 2), c.y - (bx.y + bx.h / 2));
    $('#dlgStamps').close(); if (S.tool !== 'select') setTool('select'); addObj(o, p); select(o, p);
  }

  function inViewSpace(page, fn) {
    const R = ((page.getRotation().angle % 360) + 360) % 360; const cb = page.getCropBox();
    const W = R % 180 ? cb.height : cb.width, H = R % 180 ? cb.width : cb.height, w = cb.width, h = cb.height, cx = cb.x, cy = cb.y;
    const M = R === 90 ? [0, 1, -1, 0, w + cx, cy] : R === 180 ? [-1, 0, 0, -1, w + cx, h + cy] : R === 270 ? [0, -1, 1, 0, cx, h + cy] : [1, 0, 0, 1, cx, cy];
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...M)); fn(W, H); page.pushOperators(popGraphicsState());
  }
  async function runBatch() {
    const batchFiles = getBatchFiles();
    if (!batchFiles.length) return toast('Add some PDFs first.', true);
    const act = $('#bAct').value, pw = $('#bPw').value;
    if (act === 'protect' && pw.length < 4) return toast('Use a password of at least 4 characters.', true);
    $('#dlgBatch').close();
    const zip = new JSZip(), skipped = [], used = new Set(); let merged = act === 'merge' ? await PDFDocument.create() : null, ok = 0, saved = 0;
    const suffix = { compress: 'compressed', watermark: 'watermarked', numbers: 'numbered', protect: 'protected' }[act];
    const nameFor = n => { let b = n.replace(/\.pdf$/i, '') + '-' + suffix, k = b, i = 2; while (used.has(k)) k = `${b}-${i++}`; used.add(k); return k + '.pdf'; };
    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const f = batchFiles[i]; busy(`Processing ${i + 1} of ${batchFiles.length}: ${f.name}`); await tick();
        try {
          const bytes = new Uint8Array(await f.arrayBuffer());
          const doc = await PDFDocument.load(bytes, { updateMetadata: false });
          if (merged) { (await merged.copyPages(doc, doc.getPageIndices())).forEach(pg => merged.addPage(pg)); ok++; continue; }
          if (act === 'compress') await recompressImages(doc);
          if (act === 'watermark' || act === 'numbers') {
            const font = await doc.embedFont(act === 'watermark' ? StandardFonts.HelveticaBold : StandardFonts.Helvetica); const safeT = sanitizer(font); const N = doc.getPageCount();
            doc.getPages().forEach((pg, k) => inViewSpace(pg, (W, H) => {
              if (act === 'watermark') { const t = safeT($('#bWm').value || 'CONFIDENTIAL'); const size = Math.min(W, H) * 0.12, tw = font.widthOfTextAtSize(t, size), a = Math.PI / 4; pg.drawText(t, { x: W / 2 - (tw / 2) * Math.cos(a) + size * 0.35 * Math.sin(a), y: H / 2 - (tw / 2) * Math.sin(a) - size * 0.35 * Math.cos(a), size, font, color: rgb(0.49, 0.52, 0.58), opacity: 0.15, rotate: degrees(45) }); }
              else { const fmt = $('#bPn').value, t = fmt === 'pageof' ? `Page ${k + 1} of ${N}` : fmt === 'slash' ? `${k + 1} / ${N}` : `${k + 1}`; const tw = font.widthOfTextAtSize(t, 9); pg.drawText(t, { x: (W - tw) / 2, y: 24, size: 9, font, color: rgb(0.27, 0.29, 0.34) }); }
            }));
          }
          let out = await doc.save({ useObjectStreams: true });
          if (act === 'protect') out = await encryptBytes(out, pw, { printing: true, copying: true, editing: false });
          if (act === 'compress') { if (out.length >= bytes.length) out = bytes; saved += bytes.length - out.length; }
          zip.file(nameFor(f.name), out); ok++;
        } catch (e) { console.warn(e); skipped.push(`${f.name} (${/password|encrypt/i.test(e.message) ? 'password-protected or restricted' : 'could not be read'})`); }
      }
      if (!ok) { done(); return toast('None of the files could be processed. ' + skipped.join(', '), true, 8000); }
      busy('Packaging…');
      const saveOk = merged ? await download(await merged.save({ useObjectStreams: true }), 'Merged.pdf', 'application/pdf') : await download(await zip.generateAsync({ type: 'blob' }), `Inkwell-${suffix}.zip`);
      if (saveOk) toast(`Processed ${ok} file${ok > 1 ? 's' : ''}${act === 'compress' && saved > 0 ? `, saving ${fmtSize(saved)}` : ''}.${skipped.length ? ' Skipped: ' + skipped.join(', ') : ''}`, !!skipped.length, 8000);
      track('Pro tool', { tool: 'batch', action: act, files: bucket(batchFiles.length) });
    } finally { done(); }
  }


  return { makeEditable, preloadMatchFonts, guessFontFromPixels, unlockAndOpen, protectAndSave, compressAndSave, flattenPageJpeg, buildFormLayer, applyFormValues, placeStamp, saveTemplate, templateClick, runBatch };
};
