import type { SeedArticle } from './types.js';

/**
 * Verified news articles. Research window: Sept 30 – Oct 31, 2026.
 * Sources were opened and inspected on 2026-10-31; see each article's
 * Sources section for the exact primary references.
 */
export const newsA: SeedArticle[] = [
  {
    title: 'Node.js Patches 11 Vulnerabilities Across All Supported Lines — Three of Them Are TLS Traps',
    subtitle: 'The October 2026 security release fixes four high-severity flaws, including a potential remote code execution via Brotli, and ships in v26.12.1, v24.22.1 and v22.23.4.',
    category: 'Programming',
    tags: ['nodejs', 'security', 'cve'],
    seoDescription: 'Node.js October 2026 security releases fix 11 vulnerabilities across v26, v24 and v22 — including TLS hostname-validation traps and a Brotli RCE. What changed and what to do.',
    content: `<p>On October 21, 2026, the Node.js project released security updates for every supported release line — <strong>v26.12.1</strong> (LTS "Lithium"), <strong>v24.22.1</strong> and <strong>v22.23.4</strong> — fixing eleven vulnerabilities, four of them rated High. If you run Node in production, this is the release cycle to pay attention to, because three of the high-severity bugs share a theme: programs that think they are validating a hostname may not be validating the hostname they think they are.</p>
<h2>The four high-severity fixes</h2>
<h3>1. NUL-byte hostname truncation (CVE-2026-105482)</h3>
<p>The <code>dns.resolve*()</code> and <code>dns.reverse()</code> family truncated hostnames at a NUL byte. A crafted name like <code>attacker.example\\0.trusted.example</code> could resolve as <code>attacker.example</code> even after your code "validated" the full string — the underlying library simply stopped reading at the null character. This was an incomplete fix of an earlier CVE, which is a useful reminder that hostname validation bugs tend to come back in new clothing.</p>
<h3>2. Fullwidth digits bypass TLS checks (CVE-2026-105483)</h3>
<p>TLS certificate validation could be bypassed with fullwidth Unicode digits: <code>１２７.０.０.１</code> is visually 127.0.0.1, but Node's <code>tls.checkServerIdentity()</code> treated it as a DNS name rather than an IP address, matching it against the wrong certificate field. If your service dials endpoints constructed from user input, this matters.</p>
<h3>3. Leading-zero IPv4 literals (CVE-2026-106069)</h3>
<p>Node follows the WHATWG URL convention of interpreting <code>0127.0.0.1</code> as decimal 87.0.0.1 — but some operating-system resolvers read the same string as octal 127.0.0.1. Two components agreeing on "a valid IP" while disagreeing on <em>which</em> IP is a classic validation-split bug, and it affects all three release lines.</p>
<h3>4. Brotli out-of-bounds write (CVE-2026-111497)</h3>
<p>The most serious of the four: the Brotli decoder in <code>node:zlib</code> treated an invalid block switch as "needs more input," leading to an out-of-bounds write. Depending on the application, that can mean a crash, memory disclosure, or remote code execution on any process decompressing attacker-supplied data.</p>
<h2>The medium and low fixes are not noise</h2>
<p>Among the medium-severity issues: a keep-alive HTTP agent that could accept a response sent <em>before</em> its request, certificates containing only a DNS SAN (like <code>DNS:127.0.0.1</code>) being accepted for IP endpoints when hosts were spelled in unusual ways, and — quietly interesting — <code>crypto.randomUUID()</code> entropy caches getting baked into single-executable applications, meaning every process could repeat the same sequence of UUIDs. There is also a dependency round covering c-ares, OpenSSL, SQLite and Undici, plus a refreshed CA bundle that responds to a real certificate-authority compromise (eMudhra).</p>
<h2>What you should do this week</h2>
<ul>
<li><strong>Upgrade to v26.12.1, v24.22.1 or v22.23.4</strong> — the fixes are point releases, so the upgrade risk is low compared with what is being fixed.</li>
<li><strong>Audit anything that validates hostnames or connects to IP literals</strong> — allowlist logic built on <code>dns</code> or <code>tls.checkServerIdentity()</code> deserves a second look and a regression test using hostile Unicode and zero-padded inputs.</li>
<li><strong>Check anything decompressing third-party data</strong> through <code>node:zlib</code> with Brotli, and make sure crash reporting is watching for it.</li>
</ul>
<h2>Why these bugs keep recurring</h2>
<p>Hostname parsing sits at the intersection of Unicode, legacy octal conventions and multiple RFCs, so almost every language runtime has shipped a variant of these bugs. The practical defense is not cleverness but humility: normalize identifiers once, centrally, with tests for the adversarial spellings — fullwidth digits, percent-encoding, leading zeros, embedded NULs — rather than scattering ad-hoc comparisons through the codebase.</p>
<h2>Sources</h2>
<ul>
<li>Node.js blog — "October 2026 Security Releases" (October 21, 2026): <a href="https://nodejs.org/en/blog/vulnerability/october-2026-security-releases">nodejs.org/en/blog/vulnerability/october-2026-security-releases</a> (accessed October 31, 2026)</li>
<li>Node.js release schedule: <a href="https://github.com/nodejs/release#release-schedule">github.com/nodejs/release</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'Firefox 158 Brings JPEG XL to Everyone — and Quietly Redraws the Image-Format Map',
    subtitle: 'The October 13 release makes JPEG XL a default capability, refines Firefox\u2019s Smart Window form filling, and lands a batch of under-the-radar web platform changes.',
    category: 'Internet',
    tags: ['browsers', 'firefox', 'images'],
    seoDescription: 'Firefox 158 (October 13, 2026) ships JPEG XL support by default, smarter form filling in the Smart Window, and notable web platform updates. Here is what changed and why it matters.',
    content: `<p>Firefox 158 arrived in the Release channel on <strong>October 13, 2026</strong>, and while it lacks a single headline-grabbing feature, it may matter more than the version number suggests. The reason: JPEG XL — the image format that was once rejected, then rebuilt as a community project — is now enabled by default in a mainstream browser.</p>
<h2>JPEG XL goes default</h2>
<p>Mozilla's release notes describe JPEG XL as an image format that "generally has better compression than WebP, JPEG, PNG, and GIF." That is the practical appeal in one sentence: it targets the same everyday photography and graphics workloads as those formats while producing smaller files at comparable or better quality, and it supports lossless mode, animation and wide color gamuts.</p>
<p>The format's road here was winding. JPEG XL appeared behind flags and in Nightly builds over the past year before reaching stable in 158. What makes this release significant is not the toggle itself but the position it puts web developers in: with Firefox shipping JPEG XL by default, the long-standing "one format to rule them all" question becomes a genuine three-way race between JPEG XL, WebP and AVIF.</p>
<h2>Smart Window learns to fill your forms</h2>
<p>The other user-facing change is in the Smart Window, Firefox's assistant surface. Clicking a form field or choosing "Fill" now prompts suggestions based on your relevant open tabs and saved autofill data. Mozilla notes this is a progressive rollout, so it may appear on your installation before it appears on your colleague's.</p>
<h2>The quiet web platform batch</h2>
<p>Release notes also list changes developers will feel before they read about them:</p>
<ul>
<li><strong>Typed arithmetic in CSS <code>calc()</code></strong> — unit algebra in stylesheets moves closer to first-class.</li>
<li><strong>WebAuthn conditional UI on <code>autocomplete="webauthn"</code></strong> — passkey prompts that integrate with a page's own form flow.</li>
<li><strong>Sub-pixel scroll restoration</strong> — scroll positions are no longer rounded to whole pixels, which ends subtle jitter on high-DPI and zoomed pages.</li>
<li><strong>More accessible PDF output</strong> when saving or printing on Linux and macOS, including fixes for missing math symbols.</li>
<li><strong>New translation languages</strong> (Albanian, Belarusian, Filipino) and a wallpaper library for the New Tab page.</li>
</ul>
<h2>One known wrinkle</h2>
<p>Mozilla flags a known issue affecting PWAsForFirefox: some apps may fail to start after updating. Updating the PWAsForFirefox runtime to 2.20.1 or later — or reinstalling it — resolves the problem, so if a web app refuses to launch after the upgrade, the fix is already published.</p>
<h2>What developers should do now</h2>
<p>If you serve images at scale, JPEG XL's arrival in Firefox changes the calculus for content negotiation. A pragmatic approach for 2026 remains serving AVIF or WebP first with JPEG as the floor — but it is now worth measuring JPEG XL encodings of your real asset library, because the compression gap is no longer hypothetical for Firefox users. Our companion piece on <a href="/tools/jpegxl-vs-webp-vs-avif-choosing-an-image-format-in-2026">choosing an image format in 2026</a> walks through that decision.</p>
<h2>Sources</h2>
<ul>
<li>Mozilla — Firefox 158.0 release notes (release date October 13, 2026): <a href="https://www.firefox.com/en-US/firefox/158.0/releasenotes/">firefox.com/en-US/firefox/158.0/releasenotes</a> (accessed October 31, 2026)</li>
</ul>`,
  },
];
