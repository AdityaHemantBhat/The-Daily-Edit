import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button, Input, Select, Textarea } from '../../presentation/primitives';
import { CopyButton, ResultBlock } from './shared';
import { downloadBlob } from '../../domain/value-objects/format';

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">{children}</span>;
}

// 24 — QR Code Generator
const QR_ECC = [
  { label: 'Low \u2014 smallest code', value: 'L' },
  { label: 'Medium \u2014 balanced', value: 'M' },
  { label: 'Quartile \u2014 scannable when dirty', value: 'Q' },
  { label: 'High \u2014 most robust', value: 'H' },
];

export function QrGenerator() {
  const [text, setText] = useState('https://thedailyedit.example');
  const [size, setSize] = useState(256);
  const [ecc, setEcc] = useState('M');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) { setDataUrl(''); return; }
    void QRCode.toDataURL(text, { width: size, margin: 2, errorCorrectionLevel: ecc as 'L' | 'M' | 'Q' | 'H' })
      .then(setDataUrl)
      .catch(() => setError('Could not generate a QR code for that input.'));
  }, [text, size, ecc]);

  return (
    <div className="space-y-5">
      <Textarea rows={3} value={text} onChange={(e) => { setText(e.target.value); setError(null); }} placeholder="URL, text, or any content" aria-label="QR content" />
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-lg">
        <div>
          <Label>Size</Label>
          <Select value={size} onChange={(e) => setSize(Number(e.target.value))}>
            <option value={128}>128 px</option>
            <option value={256}>256 px</option>
            <option value={512}>512 px</option>
            <option value={1024}>1024 px</option>
          </Select>
        </div>
        <div>
          <Label>Error correction</Label>
          <Select value={ecc} onChange={(e) => setEcc(e.target.value)}>
            {QR_ECC.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {dataUrl && (
        <ResultBlock
          actions={<Button size="sm" variant="outline" onClick={() => fetch(dataUrl).then((r) => r.blob()).then((b) => downloadBlob(b, 'qr-code.png'))}>Download PNG</Button>}
        >
          <img src={dataUrl} alt="Generated QR code" className="mx-auto rounded border border-rule" />
        </ResultBlock>
      )}
    </div>
  );
}

// 25 — Password Generator
export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');

  function generate() {
    let chars = '';
    if (upper) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijkmnopqrstuvwxyz';
    if (digits) chars += '23456789';
    if (symbols) chars += '!@#$%^&*()-_=+[]{};:,.?';
    if (!chars) return;
    const values = crypto.getRandomValues(new Uint32Array(length));
    setPassword(Array.from(values, (v) => chars[v % chars.length]).join(''));
  }

  useEffect(generate, []); // initial value only

  const entropy = Math.round(length * Math.log2((upper ? 24 : 0) + (lower ? 25 : 0) + (digits ? 8 : 0) + (symbols ? 24 : 0) || 2));

  return (
    <div className="space-y-5">
      <ResultBlock actions={<><CopyButton value={password} /><Button size="sm" onClick={generate}>Regenerate</Button></>}>
        <p className="break-all text-center font-mono text-xl" aria-live="polite">{password}</p>
      </ResultBlock>
      <div>
        <Label>Length: {length}</Label>
        <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-[#a16207]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([['Uppercase', upper, setUpper], ['Lowercase', lower, setLower], ['Digits', digits, setDigits], ['Symbols', symbols, setSymbols]] as const).map(([name, val, set]) => (
          <label key={name} className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="accent-[#a16207]" /> {name}
          </label>
        ))}
      </div>
      <p className="text-xs text-ink-500">≈ {entropy} bits of entropy · generated with the browser's cryptographic RNG on your device</p>
    </div>
  );
}

// 26 — UUID Generator
const UUID_FORMATS = [
  { label: 'Standard lowercase', value: 'lower' },
  { label: 'UPPERCASE', value: 'upper' },
  { label: 'Without hyphens', value: 'flat' },
  { label: 'Wrapped in braces', value: 'braces' },
];

export function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [format, setFormat] = useState('lower');

  function shape(uuid: string): string {
    switch (format) {
      case 'upper': return uuid.toUpperCase();
      case 'flat': return uuid.replace(/-/g, '');
      case 'braces': return `{${uuid}}`;
      default: return uuid;
    }
  }

  function generate() {
    setUuids(Array.from({ length: count }, () => shape(crypto.randomUUID())));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Label>How many</Label>
          <Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))} />
        </div>
        <div className="w-52">
          <Label>Format</Label>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            {UUID_FORMATS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Button onClick={generate}>Generate</Button>
      </div>
      {uuids.length > 0 && (
        <ResultBlock actions={<CopyButton value={uuids.join('\n')} label="Copy all" />}>
          <ul className="space-y-1 font-mono text-sm">
            {uuids.map((u) => <li key={u} className="break-all">{u}</li>)}
          </ul>
        </ResultBlock>
      )}
    </div>
  );
}

// 27 — Case Converter
export function CaseConverter() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  const cases: Record<string, (s: string) => string> = {
    'UPPER CASE': (s) => s.toUpperCase(),
    'lower case': (s) => s.toLowerCase(),
    'Title Case': (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
    'Sentence case': (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()),
    camelCase: (s) => s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase()),
    PascalCase: (s) => s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase()),
    snake_case: (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    'kebab-case': (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };

  return (
    <div className="space-y-5">
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text to convert…" />
      <div className="flex flex-wrap gap-2">
        {Object.entries(cases).map(([name, fn]) => (
          <Button key={name} size="sm" variant="outline" disabled={!text} onClick={() => setResult(fn(text))}>{name}</Button>
        ))}
      </div>
      {result && <ResultBlock actions={<CopyButton value={result} />}><p className="break-words font-mono text-sm">{result}</p></ResultBlock>}
    </div>
  );
}

// 28 — Reading Time Calculator
export function ReadingTime() {
  const [text, setText] = useState('');
  const [wpm, setWpm] = useState(200);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = words / Math.max(60, wpm);
  const fmt = (m: number) => {
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    return min ? `${min} min ${sec ? `${sec} s` : ''}`.trim() : `${sec} s`;
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Words</Label>
          <Input type="number" value={words || ''} onChange={(e) => setText('word '.repeat(Math.max(0, Number(e.target.value))).trim())} placeholder="Or paste text below" />
        </div>
        <div>
          <Label>Reading speed (words/min)</Label>
          <Select value={wpm} onChange={(e) => setWpm(Number(e.target.value))}>
            <option value={150}>Slow — 150</option>
            <option value={200}>Average — 200</option>
            <option value={250}>Fast — 250</option>
            <option value={300}>Speed reader — 300</option>
          </Select>
        </div>
        <div className="flex items-end">
          <p className="font-serif text-3xl font-semibold text-gold-700">{words ? fmt(minutes) : '—'}</p>
        </div>
      </div>
      <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Or paste the full text here…" />
    </div>
  );
}

// 29 — Percentage Calculator
export function PercentageCalculator() {
  const [a, setA] = useState({ x: '', y: '' });
  const [b, setB] = useState({ x: '', y: '' });
  const [c, setC] = useState({ x: '', y: '' });

  const num = (v: string) => (v === '' ? null : Number(v));

  return (
    <div className="space-y-5">
      <ResultBlock>
        <p className="mb-2 text-sm font-semibold">What is X% of Y?</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="w-28" type="number" value={a.x} onChange={(e) => setA({ ...a, x: e.target.value })} placeholder="X %" />
          <span>% of</span>
          <Input className="w-28" type="number" value={a.y} onChange={(e) => setA({ ...a, y: e.target.value })} placeholder="Y" />
          <span className="font-serif text-2xl font-semibold">= {num(a.x) !== null && num(a.y) !== null ? ((num(a.x)! / 100) * num(a.y)!).toLocaleString() : '—'}</span>
        </div>
      </ResultBlock>
      <ResultBlock>
        <p className="mb-2 text-sm font-semibold">X is what percent of Y?</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="w-28" type="number" value={b.x} onChange={(e) => setB({ ...b, x: e.target.value })} placeholder="X" />
          <span>of</span>
          <Input className="w-28" type="number" value={b.y} onChange={(e) => setB({ ...b, y: e.target.value })} placeholder="Y" />
          <span className="font-serif text-2xl font-semibold">= {num(b.x) !== null && num(b.y) ? `${((num(b.x)! / num(b.y)!) * 100).toFixed(2)}%` : '—'}</span>
        </div>
      </ResultBlock>
      <ResultBlock>
        <p className="mb-2 text-sm font-semibold">Percent change from X to Y</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="w-28" type="number" value={c.x} onChange={(e) => setC({ ...c, x: e.target.value })} placeholder="From" />
          <span>→</span>
          <Input className="w-28" type="number" value={c.y} onChange={(e) => setC({ ...c, y: e.target.value })} placeholder="To" />
          <span className="font-serif text-2xl font-semibold">
            = {num(c.x) && num(c.y) !== null ? `${(((num(c.y)! - num(c.x)!) / Math.abs(num(c.x)!)) * 100).toFixed(2)}%` : '—'}
          </span>
        </div>
      </ResultBlock>
    </div>
  );
}

// 30 — Age Calculator
export function AgeCalculator() {
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);

  function calculate() {
    if (!dob) return;
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) { years--; months += 12; }
    setAge({ years, months, days });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Date of birth</Label>
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <Button onClick={calculate}>Calculate age</Button>
      </div>
      {age && (
        <ResultBlock>
          <p className="text-center font-serif text-4xl font-semibold">
            {age.years} <span className="text-lg text-ink-500">years</span> {age.months} <span className="text-lg text-ink-500">months</span> {age.days} <span className="text-lg text-ink-500">days</span>
          </p>
        </ResultBlock>
      )}
    </div>
  );
}

// 31 — Date Calculator
export function DateCalculator() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [addDays, setAddDays] = useState('');
  const [addResult, setAddResult] = useState<string | null>(null);
  const [direction, setDirection] = useState<'plus' | 'minus'>('plus');

  const diff = start && end
    ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
    : null;

  return (
    <div className="space-y-6">
      <ResultBlock>
        <p className="mb-3 text-sm font-semibold">Days between two dates</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" className="w-44" value={start} onChange={(e) => setStart(e.target.value)} />
          <span>→</span>
          <Input type="date" className="w-44" value={end} onChange={(e) => setEnd(e.target.value)} />
          <span className="font-serif text-2xl font-semibold">= {diff !== null ? `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}` : '—'}</span>
        </div>
      </ResultBlock>
      <ResultBlock>
        <p className="mb-3 text-sm font-semibold">Add or subtract days from a date</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" className="w-44" value={start} onChange={(e) => setStart(e.target.value)} />
          <Select className="w-24" value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
            <option value="plus">+ days</option>
            <option value="minus">− days</option>
          </Select>
          <Input type="number" className="w-28" value={addDays} onChange={(e) => setAddDays(e.target.value)} />
          <Button
            size="sm"
            disabled={!start || addDays === ''}
            onClick={() => {
              const d = new Date(start);
              d.setDate(d.getDate() + (direction === 'plus' ? 1 : -1) * Number(addDays));
              setAddResult(d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
            }}
          >
            Calculate
          </Button>
        </div>
        {addResult && <p className="mt-3 font-serif text-xl font-semibold">{addResult}</p>}
      </ResultBlock>
    </div>
  );
}

// 32 — Unit Converter
const UNITS: Record<string, Record<string, number>> = {
  Length: { Meter: 1, Kilometer: 1000, Centimeter: 0.01, Millimeter: 0.001, Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  Weight: { Kilogram: 1, Gram: 0.001, Milligram: 0.000001, 'Metric ton': 1000, Pound: 0.45359237, Ounce: 0.028349523 },
  Volume: { Liter: 1, Milliliter: 0.001, 'Cubic meter': 1000, Gallon: 3.785411784, Quart: 0.946352946, Cup: 0.2365882365 },
  Data: { Byte: 1, Kilobyte: 1024, Megabyte: 1048576, Gigabyte: 1073741824, Terabyte: 1099511627776 },
};

function convertTemp(value: number, from: string, to: string): number {
  const celsius = from === 'Celsius' ? value : from === 'Fahrenheit' ? ((value - 32) * 5) / 9 : value - 273.15;
  return to === 'Celsius' ? celsius : to === 'Fahrenheit' ? (celsius * 9) / 5 + 32 : celsius + 273.15;
}

export function UnitConverter() {
  const [category, setCategory] = useState<keyof typeof UNITS | 'Temperature'>('Length');
  const [fromRaw, setFrom] = useState('Meter');
  const [toRaw, setTo] = useState('Kilometer');
  const [value, setValue] = useState('1');

  // Derive the unit list and clamp the current selections in the same render —
  // no effect timing gap, so a lookup can never hit the previous category.
  const units = category === 'Temperature'
    ? ['Celsius', 'Fahrenheit', 'Kelvin']
    : Object.keys(UNITS[category] ?? {});
  const from = units.includes(fromRaw) ? fromRaw : units[0];
  const to = units.includes(toRaw) ? toRaw : (units[1] ?? units[0]);

  const v = Number(value);
  const result = Number.isNaN(v) || !from || !to
    ? null
    : category === 'Temperature'
      ? convertTemp(v, from, to)
      : (v * (UNITS[category]?.[from] ?? 0)) / (UNITS[category]?.[to] ?? 1);

  return (
    <div className="space-y-5">
      <div>
        <Label>Category</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {Object.keys(UNITS).concat('Temperature').map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <Label>From</Label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="h-11" />
          <Select className="mt-2" value={from} onChange={(e) => setFrom(e.target.value)}>
            {units.map((u) => <option key={u}>{u}</option>)}
          </Select>
        </div>
        <span className="hidden pb-9 text-2xl text-ink-400 sm:block" aria-hidden>→</span>
        <div>
          <Label>To</Label>
          {/* Result panel sized to match the From input + gap exactly */}
          <div className="flex h-11 items-center justify-between gap-2 border border-gold-600/50 bg-gold-100/30 px-3.5" aria-live="polite">
            <p className="truncate font-serif text-xl font-semibold" title={result !== null ? String(Number(result.toPrecision(10))) : undefined}>
              {result !== null ? Number(result.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 8 }) : '—'}
            </p>
          </div>
          <Select className="mt-2" value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map((u) => <option key={u}>{u}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}
