import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Library, Trash2 } from 'lucide-react';
import { adminApi } from '../../infrastructure/api/repositories';
import { Button, Spinner } from '../../presentation/primitives';
import { convertAllToWebP } from '../../infrastructure/adapters/webp';
import { MediaLibraryModal } from './MediaLibraryModal';
import { mediaUrl as resolveMediaUrl } from '../../app/config/site';

/**
 * Featured-image picker for the article editor: shows a live preview,
 * uploads new files directly, and can browse the existing media library.
 */
export function MediaPicker({
  mediaId, mediaUrl, altText, onChange,
}: {
  mediaId: string | undefined;
  mediaUrl: string | undefined;
  altText: string;
  onChange: (media: { id: string; url: string } | null) => void;
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
      const media = res.items[0];
      onChange({ id: media.id, url: media.url });
      void qc.invalidateQueries({ queryKey: ['admin-media'] });
    },
    onError: (err) => setUploadError(err instanceof Error ? err.message : 'Upload failed'),
  });

  return (
    <div>
      <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Featured image</p>

      {/* Live preview */}
      {mediaUrl ? (
        <div className="relative mb-3 overflow-hidden rounded border border-rule-dark">
          <img src={resolveMediaUrl(mediaUrl)} alt={altText || 'Featured image preview'} className="aspect-[16/9] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-ink-950/70 p-1.5 text-paper transition-colors hover:bg-red-800"
            aria-label="Remove featured image"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="mb-3 flex aspect-[16/9] items-center justify-center border border-dashed border-rule-dark bg-paper-dark/60">
          <ImagePlus className="size-7 text-ink-400" aria-hidden />
        </div>
      )}

      {/* Direct upload + browse library */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={upload.isPending}
          onClick={() => fileInput.current?.click()}
        >
          {upload.isPending ? <Spinner className="size-3.5 border-paper/60 border-t-paper" /> : <ImagePlus className="size-3.5" aria-hidden />}
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setBrowseOpen(true)}>
          <Library className="size-3.5" aria-hidden /> Library
        </Button>
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
      {uploadError && <p className="mt-2 text-xs text-red-700">{uploadError}</p>}
      {mediaId && !mediaUrl && <p className="mt-2 break-all text-[0.65rem] text-ink-400">Media ID: {mediaId}</p>}

      <MediaLibraryModal open={browseOpen} onClose={() => setBrowseOpen(false)} onSelect={(media) => { onChange({ id: media.id, url: media.url }); setBrowseOpen(false); }} />
    </div>
  );
}
