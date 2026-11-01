import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Button, Input, Select, Textarea } from '../../presentation/primitives';
import { CopyButton, FileDrop, ResultBlock } from './shared';

function Label({ children }: { children: string }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink-500">{children}</span>;
}

// 13 — Word Counter
export function WordCounter() {
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? (text.match(/[.!?]+(\s|$)/g) ?? []).length || (words ? 1 : 0) : 0;
    return {
      words,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      sentences,
      paragraphs: text.trim() ? text.trim().split(/\n\s*\n/).length : 0,
      readingMinutes: Math.max(1, Math.round(words / 200)),
    };
  }, [text]);

  return (
    <div className="space-y-5">
      <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste your text…" aria-label="Text to analyze" />
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries({ Words: stats.words, Characters: stats.characters, 'No spaces': stats.charactersNoSpaces, Sentences: stats.sentences, Paragraphs: stats.paragraphs, 'Min read': stats.readingMinutes }).map(([k, v]) => (
          <div key={k} className="bg-white p-4 text-center">
            <p className="font-serif text-3xl font-semibold text-ink-950">{v}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">{k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 14 — Character Counter
export function CharacterCounter() {
  const [text, setText] = useState('');
  const limits = [
    ['X / Twitter post', 280], ['SMS', 160], ['Meta description', 155], ['SEO title', 60],
  ] as const;

  return (
    <div className="space-y-5">
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" aria-label="Text" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {limits.map(([name, limit]) => {
          const pct = Math.min(100, (text.length / limit) * 100);
          return (
            <div key={name} className="border border-rule bg-white p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">{name}</p>
              <p className="mt-1 font-serif text-2xl font-semibold">{text.length}<span className="text-sm text-ink-400">/{limit}</span></p>
              <div className="mt-2 h-1 bg-rule"><div className={`h-full ${pct >= 100 ? 'bg-red-600' : 'bg-gold-600'}`} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JsonErrorPosition(_json: string, message: string): number | null {
  const match = message.match(/position (\d+)/);
  return match ? Number(match[1]) : null;
}

// 15/16 — JSON Formatter & Validator
export function JsonFormatter({ mode }: { mode: 'formatter' | 'validator' }) {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState('2');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<{ message: string; position: number | null } | null>(null);

  function run() {
    setError(null);
    setOutput('');
    try {
      const parsed = JSON.parse(input);
      setOutput(mode === 'formatter' ? JSON.stringify(parsed, null, indent === 'min' ? 0 : Number(indent)) : '✓ Valid JSON');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid JSON';
      setError({ message, position: JsonErrorPosition(input, message) });
    }
  }

  return (
    <div className="space-y-5">
      <Textarea rows={8} value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"paste": "your JSON here"}' className="font-mono text-sm" aria-label="JSON input" />
      {mode === 'formatter' && (
        <div className="w-40">
          <Label>Indentation</Label>
          <Select value={indent} onChange={(e) => setIndent(e.target.value)}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="min">Minify</option>
          </Select>
        </div>
      )}
      <Button onClick={run} disabled={!input.trim()}>{mode === 'formatter' ? 'Format' : 'Validate'}</Button>
      {error && (
        <ResultBlock>
          <p className="text-sm text-red-700">{error.message}</p>
          {error.position !== null && (
            <p className="mt-1 font-mono text-xs text-ink-500">near position {error.position}: …{input.slice(Math.max(0, error.position - 20), error.position + 20)}…</p>
          )}
        </ResultBlock>
      )}
      {output && (
        <ResultBlock actions={<CopyButton value={output} />}>
          <pre className="overflow-x-auto font-mono text-sm">{output}</pre>
        </ResultBlock>
      )}
    </div>
  );
}

// 17 — Base64 Text Encoder/Decoder
export function Base64Text() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  function run() {
    setError(null);
    try {
      setOutput(mode === 'encode'
        ? btoa(String.fromCharCode(...new TextEncoder().encode(input)))
        : new TextDecoder().decode(Uint8Array.from(atob(input.replace(/\s/g, '')), (c) => c.charCodeAt(0))));
    } catch {
      setError('That input is not valid Base64.');
      setOutput('');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['encode', 'decode'] as const).map((m) => (
          <Button key={m} size="sm" variant={mode === m ? 'primary' : 'outline'} onClick={() => setMode(m)}>{m === 'encode' ? 'Encode' : 'Decode'}</Button>
        ))}
      </div>
      <Textarea rows={6} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? 'Text to encode…' : 'Base64 to decode…'} className="font-mono text-sm" />
      <Button onClick={run} disabled={!input.trim()}>Run</Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {output && <ResultBlock actions={<CopyButton value={output} />}><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm">{output}</pre></ResultBlock>}
    </div>
  );
}

// 18 — URL Encoder/Decoder
export function UrlEncoder() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch {
      setError('Malformed percent-encoding.');
      setOutput('');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['encode', 'decode'] as const).map((m) => (
          <Button key={m} size="sm" variant={mode === m ? 'primary' : 'outline'} onClick={() => setMode(m)}>{m === 'encode' ? 'Encode' : 'Decode'}</Button>
        ))}
      </div>
      <Textarea rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.com/search?q=hello world" className="font-mono text-sm" />
      <Button onClick={run} disabled={!input.trim()}>Run</Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {output && <ResultBlock actions={<CopyButton value={output} />}><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm">{output}</pre></ResultBlock>}
    </div>
  );
}

// 19 — HTML Formatter (re-indent)
function formatHtml(html: string, indentUnit: string): string {
  const tokens = html.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/g).filter((t) => t.trim());
  const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', '!doctype']);
  let depth = 0;
  const lines: string[] = [];
  for (const token of tokens) {
    const closing = /^<\//.test(token);
    const opening = /^<[a-zA-Z!]/.test(token) && !/\/>$/.test(token) && !closing;
    const tag = token.match(/^<\/?([a-zA-Z!]+)/)?.[1]?.toLowerCase() ?? '';
    if (closing && !voids.has(tag)) depth = Math.max(0, depth - 1);
    lines.push(indentUnit.repeat(depth) + token.trim());
    if (opening && !voids.has(tag) && !new RegExp(`</${tag}>`).test(token)) depth++;
  }
  return lines.join('\n');
}

const HTML_INDENTS = [
  { label: '2 spaces', value: '  ' },
  { label: '4 spaces', value: '    ' },
  { label: 'Tab', value: '\t' },
];

export function HtmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('  ');

  return (
    <div className="space-y-5">
      <Textarea rows={8} value={input} onChange={(e) => setInput(e.target.value)} placeholder="<div><p>Paste HTML</p></div>" className="font-mono text-sm" />
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-44">
          <Label>Indentation</Label>
          <Select value={indent} onChange={(e) => setIndent(e.target.value)}>
            {HTML_INDENTS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Button onClick={() => setOutput(input.trim() ? formatHtml(input, indent) : '')} disabled={!input.trim()}>Format</Button>
      </div>
      {output && <ResultBlock actions={<CopyButton value={output} />}><pre className="overflow-x-auto font-mono text-sm">{output}</pre></ResultBlock>}
    </div>
  );
}

// 20 — CSS Formatter
export function CssFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'beautify' | 'minify'>('beautify');

  function run() {
    if (mode === 'minify') {
      setOutput(input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>~+])\s*/g, '$1').replace(/;}/g, '}').trim());
    } else {
      let depth = 0;
      setOutput(
        input
          .replace(/\/\*[\s\S]*?\*\//g, (m) => m)
          .replace(/\s*([{};:,])\s*/g, '$1')
          .split('')
          .map((ch) => {
            if (ch === '{') return ' {\n' + '  '.repeat(++depth);
            if (ch === '}') return '\n' + '  '.repeat(--depth > 0 ? depth : 0) + '}';
            if (ch === ';') return ';\n' + '  '.repeat(depth);
            if (ch === ',') return ', ';
            return ch;
          })
          .join('')
          .replace(/\n{2,}/g, '\n')
          .trim(),
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['beautify', 'minify'] as const).map((m) => (
          <Button key={m} size="sm" variant={mode === m ? 'primary' : 'outline'} onClick={() => setMode(m)}>{m}</Button>
        ))}
      </div>
      <Textarea rows={8} value={input} onChange={(e) => setInput(e.target.value)} placeholder=".card { margin: 0 auto; }" className="font-mono text-sm" />
      <Button onClick={run} disabled={!input.trim()}>Run</Button>
      {output && <ResultBlock actions={<CopyButton value={output} />}><pre className="overflow-x-auto font-mono text-sm">{output}</pre></ResultBlock>}
    </div>
  );
}

// 21 — JavaScript Formatter
export function JsFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    // Syntax-validate with the browser parser, then re-indent by braces.
    try {
      new Function(input);
    } catch (e) {
      setError(e instanceof Error ? `Syntax error: ${e.message}` : 'Syntax error');
      setOutput('');
      return;
    }
    let depth = 0;
    const lines: string[] = [];
    for (const rawLine of input.replace(/\r/g, '').split('\n')) {
      const line = rawLine.trim();
      if (!line) { lines.push(''); continue; }
      if (/^[}\])]/.test(line)) depth = Math.max(0, depth - 1);
      lines.push('  '.repeat(depth) + line);
      const opens = (line.match(/[{[(]/g) ?? []).length - (line.match(/[}\])]/g) ?? []).length;
      if (opens > 0) depth += opens;
      if (opens < 0) depth = Math.max(0, depth + opens);
    }
    setOutput(lines.join('\n'));
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-500">Validates syntax and re-indents braces. It does not reformat expressions like a full engine would.</p>
      <Textarea rows={10} value={input} onChange={(e) => setInput(e.target.value)} placeholder="function greet(name) { return `Hi ${name}`; }" className="font-mono text-sm" />
      <Button onClick={run} disabled={!input.trim()}>Format</Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {output && <ResultBlock actions={<CopyButton value={output} />}><pre className="overflow-x-auto font-mono text-sm">{output}</pre></ResultBlock>}
    </div>
  );
}

// 22 — Markdown Previewer
export function MarkdownPreviewer() {
  const [input, setInput] = useState('# Hello\n\nWrite **markdown** here.\n');
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(input, { async: false })),
    [input],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea rows={16} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono text-sm" aria-label="Markdown source" />
        <div className="prose-editorial min-h-64 overflow-y-auto rounded border border-rule bg-white p-5 scroll-thin" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

// 23 — Lorem Ipsum Generator
export function LoremIpsum() {
  const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [output, setOutput] = useState('');

  function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generate() {
    const sentence = () => {
      const len = random(8, 18);
      const words = Array.from({ length: len }, () => WORDS[random(0, WORDS.length - 1)]);
      return words[0][0].toUpperCase() + words.join(' ').slice(1) + '.';
    };
    if (unit === 'words') setOutput(Array.from({ length: count }, () => WORDS[random(0, WORDS.length - 1)]).join(' '));
    else if (unit === 'sentences') setOutput(Array.from({ length: count }, sentence).join(' '));
    else setOutput(Array.from({ length: count }, () => Array.from({ length: random(3, 5) }, sentence).join(' ')).join('\n\n'));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Amount</Label>
          <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))} />
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </Select>
        </div>
      </div>
      <Button onClick={generate}>Generate</Button>
      {output && <ResultBlock actions={<CopyButton value={output} />}><p className="whitespace-pre-line text-sm leading-relaxed">{output}</p></ResultBlock>}
    </div>
  );
}

void FileDrop;
