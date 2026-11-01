import type { SeedArticle } from './types.js';

/** Evergreen educational content — no news claims; verified general knowledge. */
export const evergreenA: SeedArticle[] = [
  {
    title: 'How to Read a CVE: What CVSS Scores Actually Tell You (and What They Don\u2019t)',
    subtitle: 'A 9.8 is not automatically your emergency and a 6 is not automatically ignorable. Here is how to turn CVE IDs, CVSS scores and CISA\u2019s KEV catalog into real patching priorities.',
    category: 'How-To Guides',
    tags: ['security', 'vulnerabilities', 'explained'],
    seoDescription: 'How to read CVE identifiers, what CVSS base scores measure, why exploitation status beats severity, and how to prioritize patches using CISA\u2019s KEV catalog.',
    content: `<p>Every week brings a fresh pile of vulnerability disclosures, each with an ID like <code>CVE-2026-88771</code> and a score like 9.5. If you have ever treated that score as the whole story, this guide is for you. Reading a CVE properly takes about two minutes once you know which of the four facts on the screen actually drive your risk.</p>
<h2>Part one: the identifier itself</h2>
<p>A CVE ID has three parts. <code>CVE</code> is just the prefix. The year — <code>2026</code> — tells you when the identifier was <em>reserved or disclosed</em>, which is usually but not always when the bug was found. The sequence number is simply an ID; it carries no meaning about severity. So <code>CVE-2026-88771</code> tells you "a vulnerability, disclosed in 2026" — and nothing more. The substance lives in the advisory that cites it.</p>
<h2>Part two: what the CVSS score measures</h2>
<p>Most advisories ship with a CVSS base score from 0.0 to 10.0. The bands are: None (0), Low (0.1–3.9), Medium (4.0–6.9), High (7.0–8.9) and Critical (9.0–10). The score is computed from eight characteristics you can read directly off the vector string, and they are worth learning because they tell you <em>how</em> a bug is exploited:</p>
<ul>
<li><strong>Attack Vector (Network/Adjacent/Local/Physical)</strong> — can an attacker trigger it from the internet, your LAN, the machine itself, or only with hands on the keyboard?</li>
<li><strong>Attack Complexity (Low/High)</strong> — are there conditions beyond the attacker's control?</li>
<li><strong>Privileges Required and User Interaction</strong> — does the attacker need an account? Does a victim need to click?</li>
<li><strong>Scope (Unchanged/Changed)</strong> — does the bug escape its component and hit other things? ("Changed" bugs — sandbox escapes — deserve extra respect.)</li>
<li><strong>Impact ratings (Confidentiality/Integrity/Availability)</strong> — what the attacker actually gains: data theft, data tampering, or outage.</li>
</ul>
<p>That is how a bug like Citrix NetScaler CVE-2026-88771 earns a 9.5: <code>AV:N/AC:L/PR:N/UI:N</code> — network-triggered, no complexity, no privileges, no user interaction. Those four letters alone say "unauthenticated RCE on an internet-facing device," and the score becomes a footnote.</p>
<h2>Part three: what CVSS does not tell you</h2>
<p>CVSS base scores are <strong>static and context-free</strong>. They do not know whether you run the affected software, whether it is exposed to the internet, whether an exploit already exists in the wild, or whether your vendor has shipped a fix. Two consequences follow:</p>
<ul>
<li>A Critical bug in software you do not run is a non-event for you.</li>
<li>A Medium bug in your internet-facing edge device, with a public exploit, can be more dangerous than an unpatched Critical in your internal CMS.</li>
</ul>
<p>Severity is about the bug. Risk is about <em>the bug meeting your network</em>. Conflating the two is how teams end up emergency-patching trivia while a real problem sits in a backlog.</p>
<h2>Part four: the tiebreaker — CISA's KEV catalog</h2>
<p>When CISA adds a CVE to its <strong>Known Exploited Vulnerabilities (KEV)</strong> catalog, that is confirmation that exploitation is happening now, backed by government visibility. It is the single most actionable signal in vulnerability management: KEV-listed bugs get patched first, whatever their score. Recent examples make the point — the NetScaler zero-days (9.5, unauthenticated RCE) went straight to KEV, while plenty of 9.8-scored bugs in niche libraries sit unexploited for years.</p>
<h2>A practical triage recipe</h2>
<ol>
<li><strong>Do we run it, and where?</strong> An asset inventory answers 80% of triage instantly.</li>
<li><strong>KEV-listed?</strong> Patch on emergency timelines — days, not cycles.</li>
<li><strong>Internet-facing with Network vector and no privileges?</strong> Next priority.</li>
<li><strong>Everything else:</strong> schedule by severity within normal patch cycles, and re-check when exploit code appears.</li>
</ol>
<p>None of this requires a security team — just the habit of reading four letters of the vector string and one catalog before deciding what tonight's emergency actually is.</p>
<h2>Sources</h2>
<ul>
<li>CISA — Known Exploited Vulnerabilities (KEV) Catalog: <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog">cisa.gov/known-exploited-vulnerabilities-catalog</a> (accessed October 31, 2026)</li>
<li>FIRST — CVSS v3.1 specification and severity bands: <a href="https://www.first.org/cvss/v3.1/specification-document">first.org/cvss/v3.1/specification-document</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'JPEG XL vs WebP vs AVIF: Choosing an Image Format in 2026',
    subtitle: 'Firefox now ships JPEG XL by default, AVIF is everywhere Chrome is, and WebP is the floor. A practical decision guide for developers who serve images at scale.',
    category: 'Digital Tools',
    tags: ['images', 'web-development', 'browsers'],
    seoDescription: 'JPEG XL vs WebP vs AVIF in 2026: compression quality, browser support reality, encoding speed, and a practical content-negotiation strategy for serving images.',
    content: `<p>For most of the web's life, choosing an image format was not a choice at all — it was JPEG, full stop. The 2020s broke that monopoly, and 2026 is the first year the "modern formats" question has three real answers. With Firefox 158 shipping JPEG XL by default this October (see our coverage of <a href="/articles/firefox-158-brings-jpeg-xl-to-everyone-and-quietly-redraws-the-image-format-map">the release</a>), here is how to actually decide what to serve.</p>
<h2>The contenders in one paragraph each</h2>
<p><strong>WebP</strong> is the universal donor. Derived from Google's VP8 video codec, it compresses photographs noticeably better than JPEG, supports lossless mode and animation, and renders in every browser released in the better part of a decade. Its encoders are fast and mature. If you can only pick one modern format, this is the boring, correct answer.</p>
<p><strong>AVIF</strong> comes from the AV1 video codec family and is the compression king for photographs at low-to-medium bitrates — it regularly beats WebP by meaningful margins on real-world images, and its 10-bit and wide-gamut support is genuinely good. The trade has always been encoding speed: AVIF encoding is CPU-hungry, though it has improved steadily. Browser support now covers Chrome, Edge, Firefox, Opera and Safari, which is to say: effectively everything.</p>
<p><strong>JPEG XL</strong> is the late arrival with a particular superpower: it is the only one of the three designed as a <em>JPEG successor</em>. It offers lossless recompression of existing JPEG files (typically 20% smaller with no generation loss), lossless mode competitive with specialized codecs, and progressive decoding that renders a full-resolution image from its first bytes. Compression quality sits comfortably ahead of WebP for most content. Its catch has been politics and browser support rather than technology — which is exactly what Firefox 158 changed.</p>
<h2>The decision that actually matters: your audience's browser mix</h2>
<p>Format support, roughly as it stands in late 2026:</p>
<ul>
<li><strong>WebP:</strong> universal. Every mainstream browser in active use.</li>
<li><strong>AVIF:</strong> Chrome, Edge, Firefox, Opera, Safari — effectively universal among modern browsers, with long-tail exceptions.</li>
<li><strong>JPEG XL:</strong> Firefox by default as of 158; historically available in some niche browsers; still not shipped by Chromium or Safari by default.</li>
</ul>
<p>The practical consequence: JPEG XL is a bonus you serve <em>on top of</em> a universal baseline, not a replacement for one. Chrome's absence is the entire decision problem.</p>
<h2>A content-negotiation strategy that works today</h2>
<ol>
<li><strong>Serve WebP (or AVIF) with JPEG as fallback</strong> via the <code>&lt;picture&gt;</code> element or CDN content negotiation. This is the 2026 baseline; if you have not done it yet, it is the highest-leverage performance change available.</li>
<li><strong>Consider AVIF first for photographic content</strong> where encoding time is acceptable, since the size wins are real — but benchmark on <em>your</em> images; AVIF's advantage varies by content type.</li>
<li><strong>Add JPEG XL where your tooling makes it cheap</strong> — for Firefox's substantial share of users, and especially for any large-scale <em>recompression of existing JPEG archives</em>, where its lossless JPEG transcoding is uniquely valuable.</li>
<li><strong>Always keep a JPEG floor</strong> for the long tail of old clients and embed scenarios.</li>
</ol>
<h2>What we would do</h2>
<p>For a typical content site: AVIF or WebP generated automatically at upload time (our own <a href="/tools/image-converter">Image Converter tool</a> handles one-off conversions in the browser), JPEG fallbacks at the CDN edge, and JPEG XL measured on your top-100 images before committing to a third variant. Revisit the calculus whenever a second major engine ships JPEG XL — at that point it graduates from bonus to baseline.</p>
<h2>Sources</h2>
<ul>
<li>Mozilla — Firefox 158.0 release notes (JPEG XL enabled by default; release date October 13, 2026): <a href="https://www.firefox.com/en-US/firefox/158.0/releasenotes/">firefox.com/en-US/firefox/158.0/releasenotes</a> (accessed October 31, 2026)</li>
<li>Library feature support is verifiable per-browser on caniuse.com: <a href="https://caniuse.com">caniuse.com</a> (accessed October 31, 2026)</li>
</ul>`,
  },
];
