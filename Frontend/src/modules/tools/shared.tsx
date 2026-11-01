import { useState, type ReactNode } from 'react';
import { Check, Copy, Upload } from 'lucide-react';
import { Button } from '../../presentation/primitives';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!value}
      onClick={() =>
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : label}
    </Button>
  );
}

export function FileDrop({
  accept, multiple, onFiles, hint,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint?: string;
}) {
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handle(list: FileList | null) {
    setError(null);
    if (!list?.length) return;
    const files = Array.from(list);
    if (accept) {
      // Each comma-separated entry is its own pattern ("image/png,image/jpeg"),
      // so a file matching ANY accepted type is allowed.
      const patterns = accept.split(',').map((a) => new RegExp(`^${a.trim().replace(/\./g, '\.').replace(/\*/g, '.*')}$`));
      const imageAccept = patterns.some((p) => p.test('image/png'));
      const pdfAccept = patterns.some((p) => p.test('application/pdf'));
      for (const f of files) {
        const typeOk = patterns.some((p) => p.test(f.type));
        // Some systems provide no MIME type — fall back to a safe extension check.
        const extOk = !f.type && ((imageAccept && /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(f.name)) || (pdfAccept && /\.pdf$/i.test(f.name)));
        if (!typeOk && !extOk) {
          setError(`Unsupported file type: ${f.name} (${f.type || 'unknown type'})`);
          return;
        }
      }
    }
    onFiles(files);
  }

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors ${over ? 'border-gold-600 bg-gold-100/30' : 'border-rule-dark hover:border-ink-900'}`}
      >
        <Upload className="size-6 text-ink-400" aria-hidden />
        <p className="text-sm font-semibold text-ink-700">Drop file{multiple ? 's' : ''} here or click to choose</p>
        {hint && <p className="text-xs text-ink-400">{hint}</p>}
        <input type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      </label>
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}

export function ResultBlock({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="border border-rule bg-white">
      {actions && <div className="flex justify-end gap-2 border-b border-rule bg-paper px-3 py-2">{actions}</div>}
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Amazon-style magnifier: hovering the image shows a circular lens following
 * the cursor with a zoomed-in view, so users can inspect actual output
 * quality (compression artifacts, etc.) before downloading.
 */
export function ZoomImage({
  src, alt, className = '', zoom = 2.5, lensSize = 190,
}: {
  src: string;
  alt: string;
  className?: string;
  zoom?: number;
  lensSize?: number;
}) {
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  return (
    <span className="relative inline-block">
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`cursor-crosshair ${className}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
        }}
        onMouseLeave={() => setPos(null)}
      />
      {pos && (
        <span
          className="pointer-events-none absolute z-20 rounded-full border-2 border-white shadow-2xl"
          style={{
            width: lensSize,
            height: lensSize,
            left: pos.x - lensSize / 2,
            top: pos.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${pos.w * zoom}px ${pos.h * zoom}px`,
            backgroundPosition: `-${pos.x * zoom - lensSize / 2}px -${pos.y * zoom - lensSize / 2}px`,
          }}
          aria-hidden
        />
      )}
    </span>
  );
}
