import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Library, Trash2 } from 'lucide-react';
import { adminApi } from '../../infrastructure/api/repositories';
import { Button, Spinner } from '../../presentation/primitives';
import { MediaLibraryModal } from './MediaLibraryModal';
import { convertAllToWebP } from '../../infrastructure/adapters/webp';

/**
 * A settings field that stores a media-library URL (logo, favicon, …):
 * shows a preview, supports direct upload (WebP-converted) and library selection.
 */
export function MediaUrlField({
  value, onChange, preview, label,
}: {
  value: string | undefined;
  onChange: (url: string) => void;
  preview: 'logo' | 'favicon';
  label: string;
}) {
  const [browseOpen, setBrowseOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const [converted] = await convertAllToWebP(files);
      const form = new FormData();
      form.append('files', converted);
      return adminApi.uploadMedia(form);
    },
    onSuccess: (res) => {
      setUploadError(null);
      onChange(res.items[0].url);
      void qc.invalidateQueries({ queryKey: ['admin-media'] });
    },
    onError: (err) => setUploadError(err instanceof Error ? err.message : 'Upload failed'),
  });

  const frameSize = preview === 'favicon' ? 'size-20' : 'size-24';

  return (
    <div>
      <p className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</p>
      <div className="flex items-stretch gap-4">
        {/* Preview frame — fixed size so both fields align; checkerboard shows transparency */}
        <div
          className={`relative ${frameSize} shrink-0 rounded border border-rule bg-[repeating-conic-gradient(#f5f5f4_0%_25%,#ffffff_0%_50%)] bg-[length:12px_12px]`}
        >
          {value ? (
            <>
              <img src={value} alt={label} className="absolute inset-0 size-full object-contain p-1.5" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-ink-950 p-1 text-paper hover:bg-red-700"
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <Trash2 className="size-2.5" />
              </button>
            </>
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImagePlus className="size-5 text-ink-400" aria-hidden />
            </div>
          )}
        </div>

        {/* Controls stacked neatly beside the frame */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {value ? (
            <p className="truncate text-[0.65rem] text-ink-400" title={value}>{value}</p>
          ) : (
            <p className="text-[0.65rem] text-ink-400">No {label.toLowerCase()} set</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
              {upload.isPending ? <Spinner className="size-3.5" /> : <ImagePlus className="size-3.5" aria-hidden />}
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setBrowseOpen(true)}>
              <Library className="size-3.5" aria-hidden /> Library
            </Button>
          </div>
          {uploadError && <p className="text-xs text-red-700">{uploadError}</p>}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload.mutate(Array.from(e.target.files));
          e.target.value = '';
        }}
      />

      <MediaLibraryModal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onSelect={(media) => onChange(media.url)}
      />
    </div>
  );
}
