import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let lenisInstance: Lenis | null = null;

/**
 * Scrolls the page to the very top, correctly accounting for Lenis.
 * A bare window.scrollTo is overridden by Lenis's internal scroll target,
 * which is why route changes previously kept the old scroll position.
 */
export function scrollToTop(): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
}

/** Smooth scrolling integrated with GSAP ScrollTrigger. */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ duration: 1.05, touchMultiplier: 1.6 });
    lenisInstance = lenis;
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    let running = true;
    gsap.ticker.add((time) => {
      if (running) raf(time);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      running = false;
      lenis.off('scroll', onScroll);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

/**
 * Scroll-triggered staggered reveal for all direct children of the container.
 * Falls back to static rendering when reduced motion is preferred.
 */
export function useReveal<T extends HTMLElement>(options?: { y?: number; stagger?: number; selector?: string }) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const targets = options?.selector ? el.querySelectorAll(options.selector) : el.children;
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: options?.y ?? 28,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: options?.stagger ?? 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [options?.y, options?.stagger, options?.selector]);

  return ref;
}

/** Hero entrance: runs once on mount. */
export function useHeroEntrance<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-hero-stagger]', {
        y: 34,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return ref;
}
