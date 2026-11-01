import { useEffect, useRef, useState } from 'react';
import { useAdConfig } from '../../application/hooks/usePublicData';

interface AdSlotProps {
  /** Placement key matching the admin panel (e.g. home_top, article_mid). */
  placement: string;
  /** Min-height keeps layout stable while the ad loads or stays empty. */
  minHeight?: number;
  className?: string;
}

/**
 * Editorial advertisement slot. Renders a real AdSense unit only when the
 * admin has configured the publisher ID and enabled this placement; otherwise
 * shows a clearly-labelled, neutral placeholder. No fake ads, ever.
 */
export function AdSlot({ placement, minHeight = 110, className = '' }: AdSlotProps) {
  const { data: config, isLoading } = useAdConfig();
  const ref = useRef<HTMLDivElement>(null);
  const [pushed, setPushed] = useState(false);

  const live = config?.placements.find((p) => p.key === placement);
  const enabled = !isLoading && !!config?.publisherId && !!live;

  useEffect(() => {
    if (!enabled || pushed || !ref.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle ?? [];
      w.adsbygoogle.push({});
      setPushed(true);
    } catch {
      // AdSense script not available (blocked or not yet loaded) — keep placeholder.
    }
  }, [enabled, pushed]);

  return (
    <aside
      className={`border-y border-rule bg-paper-dark/60 ${className}`}
      style={{ minHeight }}
      aria-label="Advertisement"
    >
      <p className="pt-1 text-center text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-ink-400">
        Advertisement
      </p>
      {enabled && live ? (
        <div ref={ref} className="px-2 pb-2">
          <ins
            className="adsbygoogle block"
            style={{ display: 'block' }}
            data-ad-client={live.adClient}
            data-ad-slot={live.adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 py-6">
          <p className="text-xs text-ink-400">Free tools & stories below</p>
        </div>
      )}
    </aside>
  );
}
