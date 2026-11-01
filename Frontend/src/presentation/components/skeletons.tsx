import type React from 'react';
import { cn } from '../../lib/cn';
import { Container } from '../primitives';

/**
 * Shape-matched skeleton primitives — every loading state mirrors the actual
 * content layout so there is zero layout shift (CLS < 0.1) and the skeleton
 * communicates what is coming, not just "loading".
 */

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-stone-200/80 ${className}`} style={style} aria-hidden />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonHeading({ className = '' }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/* ---- Page-level skeleton layouts ---- */

/** Homepage: featured hero + card grid */
export function SkeletonHome() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-busy>
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="aspect-[16/9] w-full rounded" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-5 w-3/5" />
          <SkeletonText lines={2} className="w-2/3" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-3 w-20" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 border-b border-rule pb-4">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/** Article page: breadcrumb, heading, image, prose */
export function SkeletonArticle() {
  return (
    <Container>
      <div className="py-8" aria-busy>
        <Skeleton className="h-3 w-64" />
        <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_260px]">
          <div>
            <Skeleton className="mb-4 h-6 w-28" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="mt-2 h-12 w-3/4" />
            <Skeleton className="mt-5 h-5 w-2/3" />
            <div className="mt-6 flex items-center gap-3 border-y border-rule py-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="mt-8 aspect-[16/8] w-full rounded" />
            <div className="mt-8 space-y-6">
              <Skeleton className="h-7 w-1/2" />
              <SkeletonText lines={5} />
              <Skeleton className="h-7 w-2/5" />
              <SkeletonText lines={4} />
              <SkeletonText lines={4} />
            </div>
          </div>
          <div className="hidden space-y-4 lg:block">
            <Skeleton className="h-3 w-28" />
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-3.5 w-full" />)}
            <Skeleton className="mt-6 h-64 w-full" />
          </div>
        </div>
      </div>
    </Container>
  );
}

/** Category / listing page: header + card grid */
export function SkeletonListing() {
  return (
    <Container>
      <div className="py-10" aria-busy>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-12 w-72" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </Container>
  );
}

/** Tool page: header, ad slot, tool UI, FAQ */
export function SkeletonTool() {
  return (
    <Container className="py-10" aria-busy>
      <Skeleton className="h-3 w-52" />
      <Skeleton className="mt-6 h-5 w-24" />
      <Skeleton className="mt-3 h-12 w-3/4" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <div className="mt-8">
        <Skeleton className="h-px w-full" />
        <Skeleton className="mt-6 h-32 w-full rounded" />
      </div>
      <div className="mt-10">
        <Skeleton className="h-6 w-40" />
        <SkeletonText lines={3} className="mt-3" />
      </div>
    </Container>
  );
}

/** Tools directory: header, search, grid */
export function SkeletonToolsDirectory() {
  return (
    <Container>
      <div className="py-12" aria-busy>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-12 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <Skeleton className="mt-6 h-10 w-full max-w-md" />
        <div className="mt-10 space-y-14">
          {[0, 1].map((section) => (
            <div key={section}>
              <Skeleton className="mb-6 h-6 w-40" />
              <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 bg-white p-6">
                    <Skeleton className="size-5" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-2.5 w-20" />
                    <SkeletonText lines={2} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

/** Search results: query + mixed results */
export function SkeletonSearch() {
  return (
    <Container>
      <div className="py-12" aria-busy>
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="mt-3 h-4 w-48" />
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-full" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

/** Author page: avatar + name + article grid */
export function SkeletonAuthor() {
  return (
    <Container>
      <div className="py-10" aria-busy>
        <div className="flex items-center gap-6 border-b-2 border-ink-900 pb-10">
          <Skeleton className="size-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </Container>
  );
}

/** Card skeleton (shared by grids) */
export function SkeletonCard() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="aspect-[16/10] w-full rounded" />
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Admin table skeleton */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto border border-rule-dark bg-white" aria-busy>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-rule-dark">
            {Array.from({ length: cols }, (_, i) => (
              <th key={i} className="px-4 py-3"><Skeleton className="h-2.5 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r} className="border-b border-rule">
              {Array.from({ length: cols }, (_, c) => (
                <td key={c} className="px-4 py-3"><Skeleton className={cn('h-4', c === 0 ? 'w-3/4' : 'w-16')} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Admin stat card skeleton */
export function SkeletonStat() {
  return (
    <div className="border border-rule-dark bg-white p-5" aria-hidden>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="mt-2 h-9 w-20" />
      <Skeleton className="mt-1 h-3 w-32" />
    </div>
  );
}

/** Admin dashboard skeleton */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkeletonStat key={i} />)}
      </div>
      <div className="border border-rule-dark bg-white p-5">
        <Skeleton className="h-2.5 w-40" />
        <div className="mt-5 flex h-28 items-end gap-1">
          {Array.from({ length: 20 }, (_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="border border-rule-dark bg-white">
            <div className="border-b border-rule px-5 py-3"><Skeleton className="h-2.5 w-32" /></div>
            <div className="divide-y divide-rule">
              {[0, 1, 2, 3].map((r) => (
                <div key={r} className="flex items-center justify-between px-5 py-3">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

