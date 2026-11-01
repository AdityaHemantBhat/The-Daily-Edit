import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Button, Input, Select } from '../../presentation/primitives';
import { CopyButton, FileDrop, ResultBlock, ZoomImage } from './shared';
import { downloadBlob, formatBytes } from '../../domain/value-objects/format';

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">{children}</span>;
}

// 1 — Image Compressor
const SIZE_PRESETS: { label: string; value: number; unit: 'KB' | 'MB' }[] = [
  { label: '50 KB', value: 50, unit: 'KB' },
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '200 KB', value: 200, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
  { label: '2 MB', value: 2, unit: 'MB' },
  { label: '5 MB', value: 5, unit: 'MB' },
];

export function ImageCompressor() {
  const [original, setOriginal] = useState<{ file: File; url: string } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [quality, setQuality] = useState(0.6);
  const [preset, setPreset] = useState('custom');
  const [targetSize, setTargetSize] = useState(1);
  const [unit, setUnit] = useState<'KB' | 'MB'>('MB');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The underlying library always works in MB.
  const maxSizeMB = unit === 'KB' ? targetSize / 1024 : targetSize;

  function applyPreset(key: string) {
    setPreset(key);
    if (key === 'custom') return;
    const p = SIZE_PRESETS.find((x) => x.label === key);
    if (p) {
      setTargetSize(p.value);
      setUnit(p.unit);
    }
  }

  async function compress(file: File) {
    setBusy(true);
    setError(null);
    try {
      const blob = await imageCompression(file, {
        maxSizeMB: maxSizeMB,
        initialQuality: quality,
        useWebWorker: true,
      });
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError('Compression failed for this file. Try a larger target size.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="image/*" onFiles={(files) => { setOriginal({ file: files[0], url: URL.createObjectURL(files[0]) }); setResult(null); }} hint="PNG, JPEG or WebP — processed locally in your browser" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Target size</Label>
          <Select value={preset} onChange={(e) => applyPreset(e.target.value)}>
            <option value="custom">Custom…</option>
            {SIZE_PRESETS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
          </Select>
        </div>
        <div className={preset === 'custom' ? '' : 'pointer-events-none opacity-40'}>
          <Label>Custom value</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={unit === 'KB' ? 1 : 0.01}
              step={unit === 'KB' ? 1 : 0.05}
              value={targetSize}
              onChange={(e) => setTargetSize(Math.max(unit === 'KB' ? 1 : 0.01, Number(e.target.value)))}
              disabled={preset !== 'custom'}
            />
            <Select value={unit} onChange={(e) => setUnit(e.target.value as 'KB' | 'MB')} disabled={preset !== 'custom'} className="!w-24 shrink-0">
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Initial quality: {Math.round(quality * 100)}%</Label>
          <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-3 w-full accent-[#a16207]" />
        </div>
      </div>
      <p className="text-xs text-ink-400">
        Target: {unit === 'KB' ? `${targetSize} KB` : `${targetSize} MB`} — the compressor iterates quality until the file fits under the limit.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => original && compress(original.file)}
          disabled={!original || busy}
        >
          {busy ? 'Compressing…' : 'Compress image'}
        </Button>
        {original && !result && !busy && <span className="text-xs text-ink-400">Image loaded — adjust the target, then compress.</span>}
      </div>
      {busy && <p className="text-sm text-ink-500">Compressing…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {original && result && (
        <ResultBlock
          actions={<Button size="sm" onClick={() => downloadBlob(result.blob, `compressed-${original.file.name.replace(/\.\w+$/, '')}.jpg`)}>Download</Button>}
        >
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <div>
              <Label>Before — {formatBytes(original.file.size)}</Label>
              <div className="flex h-96 items-center justify-center rounded border border-rule bg-paper-dark/40 p-2">
                <ZoomImage src={original.url} alt="Original" className="max-h-88 max-w-full" zoom={3} lensSize={240} />
              </div>
              <p className="mt-1 text-xs text-ink-400">Hover to zoom · 3×</p>
            </div>
            <div>
              <Label>After</Label>
              <div className="flex h-96 items-center justify-center rounded border border-rule bg-paper-dark/40 p-2">
                <ZoomImage src={result.url} alt="Compressed" className="max-h-88 max-w-full" zoom={3} lensSize={240} />
              </div>
              <p className="mt-1 text-xs text-green-700">
                {formatBytes(result.blob.size)} ({Math.max(0, Math.round((1 - result.blob.size / original.file.size) * 100))}% smaller)
              </p>
              <p className={`text-xs ${result.blob.size <= maxSizeMB * 1024 * 1024 ? 'text-green-700' : 'text-red-700'}`}>
                {result.blob.size <= maxSizeMB * 1024 * 1024
                  ? '✓ Fits under your target'
                  : '✗ Could not reach the target — try a larger limit'}
              </p>
            </div>
          </div>
        </ResultBlock>
      )}
    </div>
  );
}

// 2 — Image Resizer
const RESIZE_PRESETS: { label: string; w: number; h: number }[] = [
  { label: 'Original size', w: 0, h: 0 },
  { label: '1920 × 1080 — Full HD', w: 1920, h: 1080 },
  { label: '1280 × 720 — HD', w: 1280, h: 720 },
  { label: '1080 × 1080 — Square post', w: 1080, h: 1080 },
  { label: '1200 × 630 — Social share card', w: 1200, h: 630 },
  { label: '800 × 600', w: 800, h: 600 },
  { label: '640 × 480 — VGA', w: 640, h: 480 },
];

export function ImageResizer() {
  const [img, setImg] = useState<{ file: File; width: number; height: number; url: string } | null>(null);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [preset, setPreset] = useState('original');

  function applyPreset(key: string) {
    setPreset(key);
    const p = RESIZE_PRESETS.find((x) => x.label === key);
    if (p && p.w > 0) {
      setW(p.w);
      setH(p.h);
      setKeepRatio(false);
    } else if (p && img) {
      setW(img.width);
      setH(img.height);
      setKeepRatio(true);
    }
  }

  function load(file: File) {
    const image = new Image();
    image.onload = () => {
      setImg({ file, width: image.naturalWidth, height: image.naturalHeight, url: image.src });
      setW(image.naturalWidth);
      setH(image.naturalHeight);
      setPreset('original');
    };
    image.src = URL.createObjectURL(file);
  }

  function resize() {
    if (!img || !w || !h) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(image, 0, 0, w, h);
      canvas.toBlob((blob) => blob && downloadBlob(blob, img.file.name.replace(/\.\w+$/, `-${w}x${h}.png`)), 'image/png');
    };
    image.src = img.url;
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="image/*" onFiles={(files) => load(files[0])} hint="Resize to exact pixel dimensions" />
      {img && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Common sizes</Label>
              <Select value={preset} onChange={(e) => applyPreset(e.target.value)}>
                {RESIZE_PRESETS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
                <option value="custom">Custom…</option>
              </Select>
            </div>
            <div>
              <Label>Width (px)</Label>
              <Input type="number" min={1} value={w} onChange={(e) => {
                const v = Number(e.target.value);
                setW(v);
                setPreset('custom');
                if (keepRatio) setH(Math.round((v / img.width) * img.height));
              }} />
            </div>
            <div>
              <Label>Height (px)</Label>
              <Input type="number" min={1} value={h} onChange={(e) => {
                const v = Number(e.target.value);
                setH(v);
                setPreset('custom');
                if (keepRatio) setW(Math.round((v / img.height) * img.width));
              }} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} className="accent-[#a16207]" />
                Keep aspect ratio
              </label>
            </div>
          </div>
          <p className="text-xs text-ink-500">Original: {img.width} × {img.height}</p>
          <img src={img.url} alt="Preview" className="max-h-56 rounded border border-rule" />
          <Button onClick={resize} disabled={!w || !h}>Resize & download PNG</Button>
        </>
      )}
    </div>
  );
}

// 3 — Image Cropper (numeric region + preview)
const ASPECTS: { label: string; value: string; ratio: number | null }[] = [
  { label: 'Free (no constraint)', value: 'free', ratio: null },
  { label: '1:1 — Square', value: '1:1', ratio: 1 },
  { label: '4:3 — Classic', value: '4:3', ratio: 4 / 3 },
  { label: '3:2 — Photo', value: '3:2', ratio: 3 / 2 },
  { label: '16:9 — Widescreen', value: '16:9', ratio: 16 / 9 },
  { label: '9:16 — Story / Reel', value: '9:16', ratio: 9 / 16 },
];

interface CropRect { x: number; y: number; w: number; h: number }
type Corner = 'nw' | 'ne' | 'sw' | 'se';
type DragMode =
  | { kind: 'new'; anchor: { x: number; y: number } }
  | { kind: 'move'; start: { x: number; y: number }; orig: CropRect }
  | { kind: 'resize'; corner: Corner; orig: CropRect };

export function ImageCropper() {
  const [img, setImg] = useState<{ file: File; width: number; height: number; url: string } | null>(null);
  const [aspect, setAspect] = useState('free');
  const [rect, setRect] = useState<CropRect | null>(null); // in displayed pixels
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragMode | null>(null);

  function load(file: File) {
    const image = new Image();
    image.onload = () => {
      setImg({ file, width: image.naturalWidth, height: image.naturalHeight, url: image.src });
      // Sensible starting crop: centered 50% (measured once the img has layout).
      requestAnimationFrame(() => {
        const el = imgRef.current;
        if (!el) return;
        setRect({ x: el.clientWidth * 0.25, y: el.clientHeight * 0.25, w: el.clientWidth * 0.5, h: el.clientHeight * 0.5 });
      });
    };
    image.src = URL.createObjectURL(file);
  }

  /** natural px per displayed px */
  function scale(): number {
    const el = imgRef.current;
    if (!el || !img) return 1;
    return img.width / el.clientWidth;
  }

  function ratio(): number | null {
    return ASPECTS.find((a) => a.value === aspect)?.ratio ?? null;
  }

  function clampRect(r: CropRect): CropRect {
    const el = imgRef.current;
    if (!el) return r;
    const W = el.clientWidth;
    const H = el.clientHeight;
    let { x, y, w, h } = r;
    w = Math.min(Math.max(4, w), W);
    h = Math.min(Math.max(4, h), H);
    x = Math.min(Math.max(0, x), W - w);
    y = Math.min(Math.max(0, y), H - h);
    const ra = ratio();
    if (ra) {
      h = Math.round(w / ra);
      if (y + h > H) {
        h = H - y;
        w = Math.round(h * ra);
      }
    }
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  }

  function relPoint(e: React.PointerEvent): { x: number; y: number } {
    const el = imgRef.current!;
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!img) return;
    const pt = relPoint(e);
    let mode: DragMode;
    const corner = (e.target as HTMLElement).dataset?.corner as Corner | undefined;
    if (rect && corner) {
      mode = { kind: 'resize', corner, orig: rect };
    } else if (rect && pt.x > rect.x && pt.x < rect.x + rect.w && pt.y > rect.y && pt.y < rect.y + rect.h) {
      mode = { kind: 'move', start: pt, orig: rect };
    } else {
      mode = { kind: 'new', anchor: pt };
      setRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
    }
    dragRef.current = mode;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: React.PointerEvent) {
    const mode = dragRef.current;
    if (!mode || !imgRef.current) return;
    const pt = relPoint(e);
    const H = imgRef.current.clientHeight;
    const ra = ratio();

    if (mode.kind === 'new') {
      let w = Math.abs(pt.x - mode.anchor.x);
      let h = Math.abs(pt.y - mode.anchor.y);
      if (ra) {
        // Constrain the dominant axis; keep the drag direction.
        if (w / ra > h) h = w / ra;
        else w = h * ra;
      }
      setRect(clampRect({ x: Math.min(pt.x, mode.anchor.x), y: Math.min(pt.y, mode.anchor.y), w, h }));
    } else if (mode.kind === 'move') {
      setRect(clampRect({
        ...mode.orig,
        x: mode.orig.x + (pt.x - mode.start.x),
        y: mode.orig.y + (pt.y - mode.start.y),
      }));
    } else {
      // Resize: move the grabbed corner, keep the opposite corner fixed.
      const { corner, orig } = mode;
      const fixed = {
        x: corner === 'nw' || corner === 'sw' ? orig.x + orig.w : orig.x,
        y: corner === 'nw' || corner === 'ne' ? orig.y + orig.h : orig.y,
      };
      let x1 = Math.min(fixed.x, pt.x);
      let x2 = Math.max(fixed.x, pt.x);
      let y1 = Math.min(fixed.y, pt.y);
      let y2 = Math.max(fixed.y, pt.y);
      if (ra) {
        const w = x2 - x1;
        const h = w / ra;
        if (y1 + h > H) {
          const hw = (H - y1) * ra;
          if (corner === 'nw' || corner === 'sw') x1 = x2 - hw; else y1 = y2 - (x2 - x1) / ra;
        } else if (corner === 'nw' || corner === 'sw') {
          y1 = y2 - h;
        } else {
          y2 = y1 + h;
        }
      }
      setRect(clampRect({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }));
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function applyAspect(key: string) {
    setAspect(key);
    const a = ASPECTS.find((v) => v.value === key);
    if (a?.ratio && rect && rect.w > 0) setRect(clampRect({ ...rect, h: rect.w / a.ratio }));
  }

  function crop() {
    if (!img || !rect) return;
    const k = scale();
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(rect.w * k));
      canvas.height = Math.max(1, Math.round(rect.h * k));
      canvas.getContext('2d')!.drawImage(
        image,
        Math.round(rect.x * k),
        Math.round(rect.y * k),
        Math.round(rect.w * k),
        Math.round(rect.h * k),
        0,
        0,
        canvas.width,
        canvas.height,
      );
      canvas.toBlob((blob) => blob && downloadBlob(blob, img.file.name.replace(/\.\w+$/, '-cropped.png')), 'image/png');
    };
    image.src = img.url;
  }

  const k = scale();
  const corners: { c: Corner; cursor: string }[] = [
    { c: 'nw', cursor: 'cursor-nwse-resize' },
    { c: 'ne', cursor: 'cursor-nesw-resize' },
    { c: 'sw', cursor: 'cursor-nesw-resize' },
    { c: 'se', cursor: 'cursor-nwse-resize' },
  ];

  return (
    <div className="space-y-5">
      <FileDrop accept="image/*" onFiles={(files) => load(files[0])} />
      {img && (
        <>
          <div className="flex justify-center">
            <div
              className="relative inline-block select-none touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img ref={imgRef} src={img.url} alt="Crop target" className="max-h-96 rounded border border-rule" draggable={false} />
              {rect && (
                <>
                  {/* dimmed shade around the selection */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-ink-950/40" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rect.x}px ${rect.y}px, ${rect.x}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y}px, ${rect.x}px ${rect.y}px)` }} />
                  </div>
                  {/* selection frame */}
                  <div className="pointer-events-none absolute border-2 border-gold-600" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
                  {/* grabbable interior for moving */}
                  <div className="absolute cursor-move" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
                  {/* corner handles */}
                  {rect && corners.map(({ c, cursor }) => (
                    <div
                      key={c}
                      data-corner={c}
                      className={`absolute size-3.5 rounded-full border-2 border-gold-600 bg-white shadow ${cursor}`}
                      style={{
                        left: c === 'nw' || c === 'sw' ? rect.x : rect.x + rect.w,
                        top: c === 'nw' || c === 'ne' ? rect.y : rect.y + rect.h,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-ink-400">
            Drag on the image to select · drag inside to move · corners to resize
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Aspect ratio</Label>
              <Select value={aspect} onChange={(e) => applyAspect(e.target.value)}>
                {ASPECTS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {([
                ['X', 'x'], ['Y', 'y'], ['W', 'w'], ['H', 'h'],
              ] as const).map(([label, key]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rect ? Math.round(rect[key as 'x' | 'y' | 'w' | 'h'] * k) : 0}
                    onChange={(e) => {
                      if (!rect) return;
                      const natural = Math.max(0, Number(e.target.value));
                      const disp = natural / k;
                      const next: CropRect = { ...rect, [key]: disp };
                      const ra = ratio();
                      if (key === 'w' && ra) next.h = disp / ra;
                      if (key === 'h' && ra) next.w = disp * ra;
                      setRect(clampRect(next));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-ink-500">
            Crop region: {rect ? `${Math.round(rect.w * k)} × ${Math.round(rect.h * k)} px` : '—'} · Source: {img.width} × {img.height}
          </p>
          <Button onClick={crop} disabled={!rect || rect.w < 4 || rect.h < 4}>Crop &amp; download PNG</Button>
        </>
      )}
    </div>
  );
}

// 4 — Image Converter
export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('image/webp');
  const [quality, setQuality] = useState(0.9);

  function convert() {
    if (!file) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      canvas.toBlob(
        (blob) => blob && downloadBlob(blob, file.name.replace(/\.\w+$/, `.${format.split('/')[1].replace('jpeg', 'jpg')}`)),
        format,
        quality,
      );
    };
    image.src = URL.createObjectURL(file);
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="image/*" onFiles={(files) => setFile(files[0])} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Target format</Label>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="image/webp">WebP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </Select>
        </div>
        <div>
          <Label>Quality ({Math.round(quality * 100)}%)</Label>
          <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-2 w-full accent-[#a16207]" />
        </div>
      </div>
      <Button onClick={convert} disabled={!file}>Convert & download</Button>
    </div>
  );
}

// 5/12 — Images to PDF
const PDF_PAGE_SIZES: Record<string, [number, number] | null> = {
  'Fit to image (variable pages)': null,
  'A4 portrait': [595.28, 841.89],
  'A4 landscape': [841.89, 595.28],
  'US Letter portrait': [612, 792],
  'US Letter landscape': [792, 612],
};

export function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState('Fit to image (variable pages)');
  const [busy, setBusy] = useState(false);

  async function build() {
    if (!files.length) return;
    setBusy(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const fixed = PDF_PAGE_SIZES[pageSize];
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
        const image = isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const margin = 24;

        if (fixed) {
          // Fixed page: scale the image to fit inside the margins, centered.
          const [pw, ph] = fixed;
          const scale = Math.min((pw - margin * 2) / image.width, (ph - margin * 2) / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          const page = doc.addPage([pw, ph]);
          page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        } else {
          // Fit-to-image: each page hugs its picture.
          const pageWidth = 595.28;
          const maxW = pageWidth - margin * 2;
          const scale = Math.min(maxW / image.width, (pageWidth * 1.414 - margin * 2) / image.height, 1);
          const page = doc.addPage([pageWidth, image.height * scale + margin * 2 > pageWidth * 1.414 ? pageWidth * 1.414 : image.height * scale + margin * 2]);
          page.drawImage(image, {
            x: margin,
            y: margin,
            width: image.width * scale,
            height: image.height * scale,
          });
        }
      }
      const pdf = await doc.save();
      downloadBlob(new Blob([pdf as unknown as BlobPart], { type: 'application/pdf' }), 'images.pdf');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="image/png,image/jpeg" multiple onFiles={setFiles} hint="PNG or JPEG files, in the order selected" />
      <div className="max-w-xs">
        <Label>Page size</Label>
        <Select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
          {Object.keys(PDF_PAGE_SIZES).map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>
      </div>
      {files.length > 0 && (
        <ul className="space-y-1 text-sm text-ink-700">
          {files.map((f, i) => <li key={i}>{i + 1}. {f.name} ({formatBytes(f.size)})</li>)}
        </ul>
      )}
      <Button onClick={build} disabled={!files.length || busy}>{busy ? 'Building…' : `Build PDF from ${files.length || ''} image${files.length === 1 ? '' : 's'}`}</Button>
    </div>
  );
}

// 6 — Image Color Picker (image eyedropper + Paint-style color editor)
const LEN_PX = 11; // pixels sampled around the cursor
const LEN_SCALE = 9; // displayed size per sampled pixel

interface Hsv { h: number; s: number; v: number }

/** MS-Paint-style pipette cursor: two-stroke SVG so it stays visible on any image. */
const PIPETTE_CURSOR = (() => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<g stroke="#ffffff" stroke-width="4.5"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></g>' +
    '<g stroke="#1c1917" stroke-width="2"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></g>' +
    '</svg>';
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 2 25, crosshair`;
})();

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace('#', '');
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0));
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hexToHsv(hex: string): Hsv {
  const { r: R, g: G, b: B } = hexToRgb(hex);
  const r = R / 255, g = G / 255, b = B / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(max === 0 ? 0 : (d / max) * 100), v: Math.round(max * 100) };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const sn = s / 100, vn = v / 100;
  const c = vn * sn;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = vn - c;
  return `#${[r + m, g + m, b + m].map((n) => Math.round(n * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function ImageColorPicker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<HTMLCanvasElement>(null);
  const svRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState<string | null>(null);
  const [hsv, setHsv] = useState<Hsv>({ h: 30, s: 70, v: 95 });
  const [hexInput, setHexInput] = useState('');
  const [hover, setHover] = useState<{ hex: string; left: number; top: number } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [screenSupported, setScreenSupported] = useState(false);

  useEffect(() => {
    setScreenSupported(typeof window !== 'undefined' && 'EyeDropper' in window);
  }, []);

  // Apply an external color into the editor.
  function adopt(hex: string) {
    setColor(hex);
    setHexInput(hex);
    setHsv(hexToHsv(hex));
  }

  // Keep outputs in sync when the editor changes the color.
  useEffect(() => {
    const hex = hsvToHex(hsv);
    setColor((prev) => (prev && hexInput && prev === hex ? prev : hex));
    setHexInput(hex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsv]);

  // ---- Paint-style SV area ----
  function drawSV() {
    const canvas = svRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = `hsl(${hsv.h}, 100%, 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sat = ctx.createLinearGradient(0, 0, canvas.width, 0);
    sat.addColorStop(0, 'rgba(255,255,255,1)');
    sat.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sat;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const val = ctx.createLinearGradient(0, 0, 0, canvas.height);
    val.addColorStop(0, 'rgba(0,0,0,0)');
    val.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = val;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // cursor ring
    const cx = (hsv.s / 100) * canvas.width;
    const cy = (1 - hsv.v / 100) * canvas.height;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
  }

  useEffect(drawSV, [hsv.h, hsv.s, hsv.v]);

  function svPointer(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = svRef.current!;
    const r = canvas.getBoundingClientRect();
    const s = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const v = Math.max(0, Math.min(100, (1 - (e.clientY - r.top) / r.height) * 100));
    setHsv((p) => ({ ...p, s: Math.round(s), v: Math.round(v) }));
  }

  function huePointer(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((e.clientX - r.left) / r.width) * 360));
    setHsv((p) => ({ ...p, h: Math.round(h) }));
  }

  function dragHandler(onMove: (e: React.PointerEvent) => void) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        onMove(e);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (e.buttons > 0) onMove(e);
      },
    };
  }

  // ---- Image eyedropper ----
  function load(file: File) {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current!;
      const maxW = 760;
      const scale = Math.min(1, maxW / image.naturalWidth);
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = URL.createObjectURL(file);
  }

  function canvasPoint(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const k = canvas.width / r.width;
    return {
      x: Math.max(0, Math.min(canvas.width - 1, Math.round((e.clientX - r.left) * k))),
      y: Math.max(0, Math.min(canvas.height - 1, Math.round((e.clientY - r.top) * k))),
    };
  }

  function pixelHex(x: number, y: number): string {
    const data = canvasRef.current!.getContext('2d', { willReadFrequently: true })!.getImageData(x, y, 1, 1).data;
    return `#${[data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }

  function onHover(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const pt = canvasPoint(e);
    if (!canvas || !pt) return;
    const hex = pixelHex(pt.x, pt.y);

    const wrap = wrapRef.current!;
    const wr = wrap.getBoundingClientRect();
    const lensSize = LEN_PX * LEN_SCALE;
    let left = e.clientX - wr.left + 16;
    let top = e.clientY - wr.top + 16;
    if (left + lensSize > wr.width) left = e.clientX - wr.left - lensSize - 16;
    if (top + lensSize > wr.height) top = e.clientY - wr.top - lensSize - 16;
    setHover({ hex, left, top });

    const lens = lensRef.current;
    if (!lens) return;
    const lctx = lens.getContext('2d')!;
    lctx.imageSmoothingEnabled = false;
    lctx.clearRect(0, 0, lens.width, lens.height);
    lctx.drawImage(canvas, pt.x - Math.floor(LEN_PX / 2), pt.y - Math.floor(LEN_PX / 2), LEN_PX, LEN_PX, 0, 0, lens.width, lens.height);
    lctx.strokeStyle = 'rgba(255,255,255,0.95)';
    lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(lens.width / 2, lens.height / 2 - 10);
    lctx.lineTo(lens.width / 2, lens.height / 2 + 10);
    lctx.moveTo(lens.width / 2 - 10, lens.height / 2);
    lctx.lineTo(lens.width / 2 + 10, lens.height / 2);
    lctx.stroke();
  }

  function pick(e: React.MouseEvent<HTMLCanvasElement>) {
    const pt = canvasPoint(e);
    if (!pt) return;
    adopt(pixelHex(pt.x, pt.y));
  }

  async function pickFromScreen() {
    try {
      const ED = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      const result = await new ED().open();
      adopt(result.sRGBHex.toUpperCase());
    } catch {
      // User pressed Escape — no color selected.
    }
  }

  function hexToCss(hex: string, mode: 'rgb' | 'hsl'): string {
    const { r, g, b } = hexToRgb(hex);
    if (mode === 'rgb') return `rgb(${r}, ${g}, ${b})`;
    const { h, s, l } = rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  return (
    <div className="space-y-5">
      <FileDrop accept="image/*" onFiles={(files) => load(files[0])} />
      {screenSupported && (
        <Button variant="outline" size="sm" onClick={() => void pickFromScreen()}>
          Pick a color from the screen
        </Button>
      )}

      <div ref={wrapRef} className="relative">
        <canvas
          ref={canvasRef}
          className="mx-auto block max-w-full rounded border border-rule"
          style={{ cursor: PIPETTE_CURSOR }}
          onMouseMove={onHover}
          onMouseLeave={() => setHover(null)}
          onClick={pick}
          aria-label="Image — click to pick a color"
        />
        {hover && (
          <>
            <div
              className="pointer-events-none absolute z-20 rounded-lg border-2 border-white shadow-2xl"
              style={{ left: hover.left, top: hover.top, width: LEN_PX * LEN_SCALE, height: LEN_PX * LEN_SCALE }}
              aria-hidden
            >
              <canvas ref={lensRef} width={LEN_PX * LEN_SCALE} height={LEN_PX * LEN_SCALE} className="block rounded-md" />
            </div>
            <div
              className="pointer-events-none absolute z-30 flex items-center gap-2 rounded border border-rule-dark bg-white/95 px-2 py-1 shadow"
              style={{ left: hover.left, top: hover.top + LEN_PX * LEN_SCALE + 6 }}
              aria-hidden
            >
              <span className="size-4 rounded border border-rule" style={{ backgroundColor: hover.hex }} />
              <span className="font-mono text-xs">{hover.hex}</span>
            </div>
          </>
        )}
      </div>
      <p className="text-center text-xs text-ink-400">Hover to inspect pixels · click to pick</p>

      {/* ---- Paint-style color editor ---- */}
      <div className="border border-rule-dark bg-white p-5">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Color editor</p>
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex-1">
            <canvas
              ref={svRef}
              width={280}
              height={200}
              className="w-full max-w-80 cursor-crosshair rounded border border-rule"
              {...dragHandler(svPointer)}
              aria-label="Saturation and brightness"
            />
            <div
              className="mt-3 h-4 w-full cursor-pointer rounded-full border border-rule"
              style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
              {...dragHandler(huePointer)}
              role="slider"
              aria-label="Hue"
              aria-valuenow={hsv.h}
              aria-valuemin={0}
              aria-valuemax={360}
            />
          </div>
          <div className="flex flex-col gap-3 lg:w-64">
            <div className="flex items-center gap-3">
              <div className="size-14 shrink-0 rounded border border-rule" style={{ backgroundColor: color ?? hsvToHex(hsv) }} aria-hidden />
              <label className="flex-1">
                <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-ink-400">Hex</span>
                <input
                  value={hexInput}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().startsWith('#') ? e.target.value.toUpperCase() : `#${e.target.value.toUpperCase()}`;
                    setHexInput(v);
                    if (/^#[0-9A-F]{6}$/.test(v)) adopt(v);
                  }}
                  className="w-full border border-rule-dark px-2.5 py-2 font-mono text-sm focus:border-ink-900 focus:outline-none"
                  maxLength={7}
                  spellCheck={false}
                />
              </label>
            </div>
            {color && (
              <>
                <p className="font-mono text-xs text-ink-500">{hexToCss(color, 'rgb')}</p>
                <p className="font-mono text-xs text-ink-500">{hexToCss(color, 'hsl')}</p>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => color && setPicked((p) => [color, ...p.filter((c) => c !== color)].slice(0, 12))} disabled={!color}>
              Add to palette
            </Button>
          </div>
        </div>
      </div>

      {picked.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Picked palette</p>
            <button onClick={() => setPicked([])} className="text-xs font-semibold text-ink-500 hover:text-red-700">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {picked.map((hex) => (
              <button
                key={hex}
                title={`${hex} — click to copy`}
                onClick={() => void navigator.clipboard.writeText(hex)}
                className="group relative size-10 rounded border border-rule-dark transition-transform hover:scale-110"
                style={{ backgroundColor: hex }}
              >
                <span className="pointer-events-none absolute -bottom-6 left-1/2 hidden -translate-x-1/2 rounded bg-ink-950 px-1.5 py-0.5 font-mono text-[0.6rem] text-paper group-hover:block">
                  {hex}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 7 — Base64 Image Encoder/Decoder
export function Base64Image() {
  const [dataUrl, setDataUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 font-serif text-xl font-semibold">Encode: image → Base64</p>
        <FileDrop accept="image/*" onFiles={(files) => {
          const reader = new FileReader();
          reader.onload = () => setDataUrl(String(reader.result));
          reader.readAsDataURL(files[0]);
        }} />
        {dataUrl && (
          <ResultBlock actions={<CopyButton value={dataUrl} label="Copy data URL" />}>
            <img src={dataUrl} alt="Encoded preview" className="max-h-40 rounded border border-rule" />
            <p className="mt-2 break-all font-mono text-xs text-ink-500">{dataUrl.slice(0, 120)}…</p>
          </ResultBlock>
        )}
      </section>
      <section>
        <p className="mb-2 font-serif text-xl font-semibold">Decode: Base64 → image</p>
        <textarea
          className="w-full border border-rule-dark p-3 font-mono text-xs"
          rows={4}
          placeholder="Paste a data:image/… string"
          onChange={(e) => {
            setError(null);
            const v = e.target.value.trim();
            if (v.startsWith('data:image/')) setPreview(v);
            else setPreview(v ? `data:image/png;base64,${v}` : null);
            if (v && !/^[A-Za-z0-9+/=\s]+$/.test(v.replace(/^data:image\/\w+;base64,/, ''))) setError('That does not look like valid Base64.');
          }}
        />
        {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
        {preview && !error && <img src={preview} alt="Decoded" className="mt-3 max-h-40 rounded border border-rule" onError={() => setError('Could not render that Base64 as an image.')} />}
      </section>
    </div>
  );
}

