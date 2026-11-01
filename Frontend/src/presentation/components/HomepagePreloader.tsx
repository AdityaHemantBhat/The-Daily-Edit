import React, { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';

const initialDocumentPath = typeof window === 'undefined' ? '' : window.location.pathname;
let hasPlayedHomePreloader = false;

const closedShape = 'M0,1005S175,995,500,995s500,5,500,5V0H0Z';
const curvedShape = 'M0 502S175 272 500 272s500 230 500 230V0H0Z';
const closedCurve = 'M0 1000S175 1000 500 1000s500 0 500 0';
const curvedCurve = 'M0 502S175 272 500 272s500 230 500 230';

const BRAND_WORDS: { text: string; gold: boolean }[] = [
  { text: 'THE', gold: false },
  { text: 'DAILY', gold: true },
  { text: 'EDIT.', gold: false },
];

interface HomepagePreloaderProps {
  onDone: () => void;
  children: ReactNode;
}

export const HomepagePreloader: React.FC<HomepagePreloaderProps> = ({ onDone, children }) => {
  const siteRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const [showPreloader, setShowPreloader] = useState(
    () => initialDocumentPath === '/' && !hasPlayedHomePreloader &&
      typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useLayoutEffect(() => {
    if (!showPreloader || !preloaderRef.current) return;

    hasPlayedHomePreloader = true;
    const root = preloaderRef.current;
    const curtain = root.querySelector<SVGPathElement>('[data-preloader-curtain]');
    const curveLine = root.querySelector<SVGPathElement>('[data-preloader-curve-line]');
    const tagline = root.querySelector<HTMLElement>('[data-preloader-tagline]');
    const titleLetters = root.querySelectorAll<HTMLElement>('[data-preloader-title-letter]');
    const goldRule = root.querySelector<HTMLElement>('[data-preloader-rule]');

    let timeline: gsap.core.Timeline | undefined;

    if (curtain) gsap.set(curtain, { attr: { d: closedShape } });
    if (curveLine) gsap.set(curveLine, { attr: { d: closedCurve } });
    if (tagline) gsap.set(tagline, { autoAlpha: 0, y: 5 });
    if (titleLetters.length) gsap.set(titleLetters, { autoAlpha: 0, y: 5 });
    if (goldRule) gsap.set(goldRule, { scaleX: 0 });

    const site = siteRef.current;
    if (site) gsap.set(site, { opacity: 1 });

    timeline = gsap.timeline({
      onComplete: () => {
        setShowPreloader(false);
        onDone();
      },
    });

    if (tagline) {
      timeline.to(tagline, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.15');
    }
    if (titleLetters.length) {
      timeline.to(
        titleLetters,
        { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.035, ease: 'power1.out' },
        '-=0.05',
      );
    }
    if (goldRule) {
      timeline.to(goldRule, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, '-=0.1');
    }

    timeline.addLabel('curtainOpen', '+=1.1');
    if (curtain) {
      timeline.to(curtain, { duration: 2.2, attr: { d: curvedShape }, ease: 'power2.inOut' }, 'curtainOpen');
    }
    if (curveLine) {
      timeline.to(curveLine, { duration: 2.2, attr: { d: curvedCurve }, ease: 'power2.inOut' }, 'curtainOpen');
    }
    timeline.to(root, { y: '-120%', duration: 2.2, ease: 'power3.inOut' }, 'curtainOpen');

    if (tagline) timeline.to(tagline, { autoAlpha: 0, duration: 0.4 }, 'curtainOpen+=1.2');
    if (titleLetters.length) timeline.to(titleLetters, { autoAlpha: 0, duration: 0.4, stagger: 0.02 }, 'curtainOpen+=1.2');
    if (goldRule) timeline.to(goldRule, { autoAlpha: 0, duration: 0.4 }, 'curtainOpen+=1.2');

    return () => {
      timeline?.kill();
    };
  }, [showPreloader]);

  return (
    <>
      <div ref={siteRef}>
        {children}
      </div>

      {showPreloader && (
        <div
          ref={preloaderRef}
          className="fixed inset-0 z-[10000] flex min-h-[100svh] items-center justify-center overflow-hidden bg-transparent px-6"
          role="status"
          aria-label="Loading The Daily Edit"
        >
          <svg className="absolute inset-0 z-0 size-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            <path data-preloader-curtain d={closedShape} fill="#fafaf9" />
            <path data-preloader-curve-line d={closedCurve} fill="none" stroke="#a16207" strokeWidth="2" />
          </svg>

          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
            <div className="mt-4 w-full py-1">
              <h1 aria-label="The Daily Edit" className="font-serif text-[2.2rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.02em] sm:tracking-[0.03em] text-[#1c1917] leading-tight">
                {BRAND_WORDS.map((word) => (
                  <span key={word.text} className="inline whitespace-pre">
                    {word.text.split('').map((letter, index) => (
                      <span key={`${word.text}-${letter}-${index}`} data-preloader-title-letter aria-hidden="true" className={`inline-block ${word.gold ? 'text-gold-600' : ''}`}>
                        {letter}
                      </span>
                    ))}
                    <span>&nbsp;</span>
                  </span>
                ))}
              </h1>
            </div>
            <p data-preloader-tagline className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-ink-500">
              Digital Publication
            </p>
            <div data-preloader-rule className="mt-3 h-0.5 w-48 overflow-hidden md:w-64">
              <div className="size-full origin-left bg-gold-600" style={{ transform: 'scaleX(0)' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function shouldShowHomepagePreloader(pathname: string): boolean {
  return pathname === '/';
}
