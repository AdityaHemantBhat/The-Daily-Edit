import { lazy, Suspense, type ComponentType } from 'react';
import { Spinner } from '../../presentation/primitives';

/**
 * Registry maps backend tool `componentKey`s to lazily-loaded client
 * components. Code-splitting keeps each tool's bundle independent.
 */
const REGISTRY: Record<string, () => Promise<{ default: ComponentType }>> = {
  'image-compressor': () => import('./ImageTools').then((m) => ({ default: m.ImageCompressor })),
  'image-resizer': () => import('./ImageTools').then((m) => ({ default: m.ImageResizer })),
  'image-cropper': () => import('./ImageTools').then((m) => ({ default: m.ImageCropper })),
  'image-converter': () => import('./ImageTools').then((m) => ({ default: m.ImageConverter })),
  'image-to-pdf': () => import('./ImageTools').then((m) => ({ default: m.ImagesToPdf })),
  'images-to-pdf': () => import('./ImageTools').then((m) => ({ default: m.ImagesToPdf })),
  'image-color-picker': () => import('./ImageTools').then((m) => ({ default: m.ImageColorPicker })),
  'base64-image': () => import('./ImageTools').then((m) => ({ default: m.Base64Image })),

  'merge-pdf': () => import('./PdfTools').then((m) => ({ default: m.MergePdf })),
  'split-pdf': () => import('./PdfTools').then((m) => ({ default: m.SplitPdf })),
  'compress-pdf': () => import('./PdfTools').then((m) => ({ default: m.CompressPdf })),
  'pdf-to-images': () => import('./PdfTools').then((m) => ({ default: m.PdfToImages })),

  'word-counter': () => import('./TextTools').then((m) => ({ default: m.WordCounter })),
  'character-counter': () => import('./TextTools').then((m) => ({ default: m.CharacterCounter })),
  'json-formatter': () => import('./TextTools').then((m) => ({ default: () => <m.JsonFormatter mode="formatter" /> })),
  'json-validator': () => import('./TextTools').then((m) => ({ default: () => <m.JsonFormatter mode="validator" /> })),
  'base64-text': () => import('./TextTools').then((m) => ({ default: m.Base64Text })),
  'url-encoder': () => import('./TextTools').then((m) => ({ default: m.UrlEncoder })),
  'html-formatter': () => import('./TextTools').then((m) => ({ default: m.HtmlFormatter })),
  'css-formatter': () => import('./TextTools').then((m) => ({ default: m.CssFormatter })),
  'js-formatter': () => import('./TextTools').then((m) => ({ default: m.JsFormatter })),
  'markdown-previewer': () => import('./TextTools').then((m) => ({ default: m.MarkdownPreviewer })),
  'lorem-ipsum': () => import('./TextTools').then((m) => ({ default: m.LoremIpsum })),

  'qr-generator': () => import('./ProductivityTools').then((m) => ({ default: m.QrGenerator })),
  'password-generator': () => import('./ProductivityTools').then((m) => ({ default: m.PasswordGenerator })),
  'uuid-generator': () => import('./ProductivityTools').then((m) => ({ default: m.UuidGenerator })),
  'case-converter': () => import('./ProductivityTools').then((m) => ({ default: m.CaseConverter })),
  'reading-time': () => import('./ProductivityTools').then((m) => ({ default: m.ReadingTime })),
  'percentage-calculator': () => import('./ProductivityTools').then((m) => ({ default: m.PercentageCalculator })),
  'age-calculator': () => import('./ProductivityTools').then((m) => ({ default: m.AgeCalculator })),
  'date-calculator': () => import('./ProductivityTools').then((m) => ({ default: m.DateCalculator })),
  'unit-converter': () => import('./ProductivityTools').then((m) => ({ default: m.UnitConverter })),
};

const lazyComponents = Object.fromEntries(
  Object.entries(REGISTRY).map(([key, load]) => [key, lazy(load)]),
) as Record<string, ComponentType>;

export function ToolComponent({ componentKey }: { componentKey: string }) {
  const Component = lazyComponents[componentKey];
  if (!Component) {
    return <p className="text-sm text-ink-500">This tool's interface is not available in this build.</p>;
  }

  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner className="size-8" /></div>}>
      <Component />
    </Suspense>
  );
}
