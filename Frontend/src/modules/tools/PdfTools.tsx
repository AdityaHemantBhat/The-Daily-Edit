import { useState } from 'react';
import { Button, Input, Select } from '../../presentation/primitives';
import { FileDrop } from './shared';
import { downloadBlob, formatBytes } from '../../domain/value-objects/format';

function Label({ children }: { children: string }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">{children}</span>;
}

async function loadPdf(file: File) {
  const { PDFDocument } = await import('pdf-lib');
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

// 8 — Merge PDF
export function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function merge() {
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const out = await PDFDocument.create();
      for (const file of files) {
        const src = await loadPdf(file);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      downloadBlob(new Blob([await out.save() as unknown as BlobPart], { type: 'application/pdf' }), 'merged.pdf');
    } catch {
      setError('One of these files could not be read. Encrypted PDFs are not supported.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="application/pdf" multiple onFiles={setFiles} hint="All files processed locally — nothing is uploaded" />
      {files.length > 0 && (
        <ul className="space-y-1 text-sm text-ink-700">
          {files.map((f, i) => <li key={i}>{i + 1}. {f.name} ({formatBytes(f.size)})</li>)}
        </ul>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button onClick={merge} disabled={files.length < 2 || busy}>{busy ? 'Merging…' : `Merge ${files.length || ''} PDFs`}</Button>
    </div>
  );
}

// 9 — Split PDF
export function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState('1');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function parseRange(input: string, max: number): number[] {
    const pages = new Set<number>();
    for (const part of input.split(',')) {
      const [a, b] = part.split('-').map((n) => parseInt(n.trim(), 10));
      if (Number.isNaN(a)) continue;
      const start = a;
      const end = Number.isNaN(b) ? a : Math.min(b, max);
      for (let i = start; i <= end; i++) if (i >= 1 && i <= max) pages.add(i - 1);
    }
    return [...pages].sort((a, b) => a - b);
  }

  async function split() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await loadPdf(file);
      const indices = parseRange(range, src.getPageCount());
      if (!indices.length) {
        setError(`Enter pages between 1 and ${src.getPageCount()}.`);
        return;
      }
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      downloadBlob(new Blob([await out.save() as unknown as BlobPart], { type: 'application/pdf' }), 'split.pdf');
    } catch {
      setError('This PDF could not be read.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="application/pdf" onFiles={(files) => {
        setFile(files[0]);
        setPageCount(null);
        void loadPdf(files[0]).then((doc) => setPageCount(doc.getPageCount())).catch(() => setError('Unreadable PDF.'));
      }} hint="Extract pages like 1-3, 5, 8-10" />
      {pageCount !== null && <p className="text-sm text-ink-500">This PDF has {pageCount} page{pageCount === 1 ? '' : 's'}.</p>}
      <div>
        <Label>Pages to keep</Label>
        <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="1-3, 5" />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button onClick={split} disabled={!file || busy}>{busy ? 'Splitting…' : 'Split & download'}</Button>
    </div>
  );
}

// 10 — Compress PDF
const PDF_COMPRESS_PRESETS: { label: string; value: number; unit: 'KB' | 'MB' }[] = [
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '300 KB', value: 300, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
  { label: '2 MB', value: 2, unit: 'MB' },
];

type CompressMode = string; // 'lossless' | preset label | 'custom'

async function compressToTarget(
  file: File,
  targetBytes: number,
  onProgress: (attempt: number, total: number) => void,
): Promise<Uint8Array | null> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const { PDFDocument } = await import('pdf-lib');
  const src = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageCount = Math.min(src.numPages, 30);

  // Progressive rasterization: render pages to JPEG at decreasing quality
  // until the rebuilt document fits the target (or give the smallest result).
  const attempts = [
    { quality: 0.72, scale: 1.5 },
    { quality: 0.6, scale: 1.4 },
    { quality: 0.5, scale: 1.25 },
    { quality: 0.42, scale: 1.1 },
    { quality: 0.34, scale: 1.0 },
    { quality: 0.28, scale: 0.85 },
  ];
  let best: Uint8Array | null = null;

  for (const [idx, a] of attempts.entries()) {
    onProgress(idx + 1, attempts.length);
    const out = await PDFDocument.create();
    for (let i = 1; i <= pageCount; i++) {
      const page = await src.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: a.scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/jpeg', a.quality));
      if (!blob) continue;
      const img = await out.embedJpg(await blob.arrayBuffer());
      const p = out.addPage([base.width, base.height]);
      p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    }
    const bytes = await out.save({ useObjectStreams: true });
    if (!best || bytes.length < best.length) best = bytes;
    if (bytes.length <= targetBytes) return bytes;
  }
  return best;
}

export function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<CompressMode>('lossless');
  const [customSize, setCustomSize] = useState(500);
  const [unit, setUnit] = useState<'KB' | 'MB'>('KB');
  const [result, setResult] = useState<{ before: number; after: number; targetMet: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetBytes = unit === 'KB' ? customSize * 1024 : customSize * 1024 * 1024;
  const isTargetMode = mode !== 'lossless';

  async function compress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      let bytes: Uint8Array | null;
      if (!isTargetMode) {
        // Lossless: rebuild with object streams — text stays selectable.
        const { PDFDocument } = await import('pdf-lib');
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        bytes = await doc.save({ useObjectStreams: true });
      } else {
        bytes = await compressToTarget(file, targetBytes, () => undefined);
      }
      if (!bytes) throw new Error('Compression failed.');
      const after = bytes.length;
      setResult({ before: file.size, after, targetMet: !isTargetMode || after <= targetBytes });
      downloadBlob(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }), 'compressed.pdf');
    } catch {
      setError('This PDF could not be processed. Encrypted files are not supported.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="application/pdf" onFiles={(files) => { setFile(files[0]); setResult(null); }} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Compression mode</Label>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="lossless">Lossless — structure only</option>
            {PDF_COMPRESS_PRESETS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
            <option value="custom">Custom…</option>
          </Select>
        </div>
        <div className={!isTargetMode ? 'pointer-events-none opacity-40' : ''}>
          <Label>Custom value</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={unit === 'KB' ? 10 : 0.01}
              value={customSize}
              onChange={(e) => setCustomSize(Math.max(unit === 'KB' ? 10 : 0.01, Number(e.target.value)))}
              disabled={!isTargetMode}
            />
            <Select value={unit} onChange={(e) => setUnit(e.target.value as 'KB' | 'MB')} disabled={!isTargetMode} className="!w-24 shrink-0">
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>First 30 pages</Label>
          <p className="text-xs leading-5 text-ink-400">
            {isTargetMode
              ? 'Target mode rasterizes pages to fit — text becomes part of the image.'
              : 'Keeps all text selectable. Gains vary by file.'}
          </p>
        </div>
      </div>

      {busy && <p className="text-sm text-ink-500">Compressing… {isTargetMode ? '(trying quality levels)' : ''}</p>}
      {result && (
        <div className="space-y-1">
          <p className="text-sm text-green-700">
            {formatBytes(result.before)} → {formatBytes(result.after)} ({Math.max(0, Math.round((1 - result.after / result.before) * 100))}% smaller)
          </p>
          <p className={`text-xs ${result.targetMet ? 'text-green-700' : 'text-red-700'}`}>
            {result.targetMet
              ? '✓ Fits under your target'
              : '✗ Could not reach the target — this is the smallest achievable quality'}
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button onClick={compress} disabled={!file || busy}>{busy ? 'Compressing…' : 'Compress & download'}</Button>
    </div>
  );
}

// 11 — PDF to Images
const PDF_RENDER_SCALES = [
  { label: 'Screen quality — 72 dpi', value: 1 },
  { label: 'Sharp — ~108 dpi', value: 1.5 },
  { label: 'Print quality — 144 dpi', value: 2 },
  { label: 'Maximum — 216 dpi', value: 3 },
];

const RENDER_PAGE_SIZE = 12;

export function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ url: string; page: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [viewPage, setViewPage] = useState(1);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPages([]);
    setProgress(0);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const out: { url: string; page: number }[] = [];
      const maxPages = Math.min(doc.numPages, 100);
      for (let i = 1; i <= maxPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
        out.push({ url: canvas.toDataURL('image/png'), page: i });
        setProgress(Math.round((i / maxPages) * 100));
      }
      setPages(out);
    } catch {
      setError('This PDF could not be rendered.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="application/pdf" onFiles={(files) => { setFile(files[0]); setPages([]); setViewPage(1); }} hint="First 100 pages are rendered — results are paginated below" />
      <div className="max-w-xs">
        <Label>Output resolution</Label>
        <Select value={String(scale)} onChange={(e) => setScale(Number(e.target.value))}>
          {PDF_RENDER_SCALES.map((o) => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
        </Select>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button onClick={render} disabled={!file || busy}>{busy ? `Rendering… ${progress}%` : 'Render pages'}</Button>
      {pages.length > RENDER_PAGE_SIZE && (
        <p className="text-center text-xs text-ink-500">
          {pages.length} page{pages.length === 1 ? '' : 's'} rendered · showing {RENDER_PAGE_SIZE} per page
        </p>
      )}
      {pages.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.slice((viewPage - 1) * RENDER_PAGE_SIZE, viewPage * RENDER_PAGE_SIZE).map((p) => (
            <div key={p.page} className="border border-rule p-2">
              <img src={p.url} alt={`Page ${p.page}`} className="w-full rounded border border-rule" />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-ink-500">Page {p.page}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const [meta, b64] = p.url.split(',');
                    const mime = meta.match(/data:(.*?);/)?.[1] ?? 'image/png';
                    fetch(p.url).then((r) => r.blob()).then((b) => downloadBlob(b, `page-${p.page}.png`));
                    void mime; void b64;
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pages.length > RENDER_PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={viewPage <= 1} onClick={() => setViewPage((p) => p - 1)}>←</Button>
          {Array.from({ length: Math.ceil(pages.length / RENDER_PAGE_SIZE) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setViewPage(n)}
              className={`size-8 rounded text-sm font-semibold ${n === viewPage ? 'bg-ink-900 text-paper' : 'border border-rule-dark text-ink-700 hover:border-ink-900'}`}
              aria-label={`Go to results page ${n}`}
              aria-current={n === viewPage ? 'page' : undefined}
            >
              {n}
            </button>
          ))}
          <Button size="sm" variant="outline" disabled={viewPage >= Math.ceil(pages.length / RENDER_PAGE_SIZE)} onClick={() => setViewPage((p) => p + 1)}>→</Button>
        </div>
      )}
    </div>
  );
}

void Label;
