import type { SeedArticle } from './types.js';

/**
 * October 2026 verified developments — batch 2.
 * Sources inspected 2026-10-31 (see each article's Sources section).
 */
export const newsD: SeedArticle[] = [
  {
    title: 'Patch Tuesday Just Broke Its Own Record: 1,400+ Flaws, Three Zero-Days',
    subtitle: 'The October 2026 Microsoft update was the biggest ever — and one of the fixed bugs was already being used in real attacks. What Windows users should prioritize.',
    category: 'Security & Privacy',
    tags: ['security', 'windows', 'microsoft'],
    seoDescription: 'October 2026 Patch Tuesday fixed a record 1,400+ CVEs including three zero-days. What Windows users should patch first and why counts vary between trackers.',
    content: `<p>The second Tuesday of October has a rhythm: Microsoft publishes its fixes, the security community tallies them, and everyone gets back to work. October 2026 broke the rhythm. The <strong>October 13 release was the largest Patch Tuesday in history</strong> — trackers counted between roughly <strong>1,400 and 1,460 fixed vulnerabilities</strong> depending on how products are deduplicated — and three of them were zero-days, including one already exploited in the wild.</p>
<h2>The numbers, honestly</h2>
<p>Why do counts differ? SANS' Internet Storm Center tallied <strong>1,417 CVEs with 76 rated Critical</strong>; other trackers landed between 1,407 and 1,460. The differences come from deduplication and which Microsoft products each counter covers — Windows itself accounted for well over a thousand. The authoritative list lives on Microsoft's Security Response Center (MSRC) release notes.</p>
<h2>The zero-day that matters most</h2>
<p>Among the fixes, <strong>CVE-2026-96951</strong> stands out: a Windows Shell security feature bypass that was <strong>already being exploited</strong> before the patch. It defeats Mark-of-the-Web protections — the mechanism that warns you when a file came from the internet. In practice, bugs like this chain beautifully with phishing: a malicious document that used to trigger a warning stops triggering it. Patch this one first.</p>
<h2>How to digest a 1,400-CVE release</h2>
<ul>
<li><strong>Home users:</strong> run Windows Update, reboot, done. The cumulative update includes everything.</li>
<li><strong>IT teams:</strong> prioritize the exploited zero-day and anything Critical in Windows Shell, Outlook and Office — the products most exposed to untrusted files and emails — then roll the rest through your normal rings.</li>
<li><strong>Everyone:</strong> expect follow-up servicing. Record-sized releases sometimes carry regressions; test before wide deployment if you manage fleets.</li>
</ul>
<h2>The bigger picture</h2>
<p>Two record-setting Patch Tuesdays in one year tell a story about Microsoft's attack surface: more products, more code, more researchers looking. The size of the release is uncomfortable, but the alternative — bugs left unpatched — is worse. The habit that protects you is boring and timeless: patch early in the week it ships.</p>
<h2>Sources</h2>
<ul>
<li>Microsoft Security Response Center — October 2026 security update release notes: <a href="https://msrc.microsoft.com/update-guide/releaseNote/2026-Oct">msrc.microsoft.com/update-guide/releaseNote/2026-Oct</a> (dynamic page; accessed October 31, 2026)</li>
<li>SANS Internet Storm Center — October 2026 Patch Tuesday summary (1,417 CVEs, 76 Critical): <a href="https://isc.sans.edu/podcastdetail/10136">isc.sans.edu/podcastdetail/10136</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'Chrome Starts Warning You About HTTP Sites — the Last stretch of the Web\u2019s Quiet Migration',
    subtitle: 'Google\u2019s browser now alerts users before loading non-HTTPS pages. What actually changes for site owners and for everyday browsing.',
    category: 'Internet',
    tags: ['browsers', 'chrome', 'security'],
    seoDescription: 'Chrome now warns users before loading HTTP sites. What the warning means, why the web moved to HTTPS, and the short checklist to make sure your site never triggers it.',
    content: `<p>Chrome has begun <strong>warning users before loading sites that don't use HTTPS</strong>, completing a migration the industry started in earnest in 2018. For years the browser UI made padlocks the norm; now the inverse is true — the absence of encryption is the thing that gets flagged.</p>
<h2>What the warning does</h2>
<p>When a site still serves over plain HTTP, Chrome interrupts the load with an alert before content appears. The user can continue, but the friction does the talking: non-encrypted sites now look like what they are — an exception.</p>
<h2>Why the web went this way</h2>
<p>HTTPS does three things plain HTTP cannot: it encrypts traffic in transit, it authenticates the server you are talking to, and it protects the integrity of what you receive. Without it, anything between you and the site — a café network, an ISP, a state actor — can read or alter the page. The web's platforms pushed hard: free certificate authorities (Let's Encrypt foremost), browser features gated behind secure contexts, and SEO signals all made HTTPS the default. This warning is the final nudge for the holdouts.</p>
<h2>The short checklist for site owners</h2>
<ul>
<li><strong>Get a certificate.</strong> Let's Encrypt issues them free and automates renewal.</li>
<li><strong>Redirect all HTTP traffic to HTTPS</strong> with a permanent redirect, and enable HSTS once you're stable.</li>
<li><strong>Fix mixed content.</strong> One <code>http://</code> image or script inside an HTTPS page still triggers browser warnings.</li>
<li><strong>Update internal links and sitemaps</strong> to the https versions of your URLs.</li>
</ul>
<p>Our own <a href="/tools">tools directory</a> runs entirely over HTTPS — and if your site does the same, this Chrome change will be invisible to you, which is exactly the point.</p>
<h2>What it means for users</h2>
<p>If you hit the warning on a site you trust, it's a sign the site is behind on maintenance — proceed with caution and avoid entering anything sensitive. On a site you've never heard of, treat the warning as exactly what it is: the strongest signal a browser can give that the connection is not protected.</p>
<h2>Sources</h2>
<ul>
<li>Chrome platform security coverage of the HTTP warning rollout (October 2026), as reported across developer publications — details cross-checked via multiple independent search results (accessed October 31, 2026)</li>
<li>Let's Encrypt — free, automated TLS certificates: <a href="https://letsencrypt.org/">letsencrypt.org</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'Windows 11\u2019s October Update: the Fixes and Features Worth Knowing About',
    subtitle: 'Bluetooth reliability, fingerprint sign-in after cold boot, a File Explorer that remembers where you were — the mid-October cumulative update quietly repairs daily life.',
    category: 'Technology',
    tags: ['windows', 'microsoft', 'updates'],
    seoDescription: 'The Windows 11 October 2026 cumulative update (KB5127648) improves Bluetooth, fingerprint sign-in, File Explorer and more. What changed and how to get it.',
    content: `<p>Not every Windows update deserves an article. The mid-October 2026 cumulative update for Windows 11 (<strong>KB5127648</strong>) does, because it repairs a handful of small, daily-life annoyances that individually seemed trivial — and together made the OS feel unfinished.</p>
<h2>The quality-of-life repairs</h2>
<ul>
<li><strong>Bluetooth reliability.</strong> The stack that connects your headphones and mice got stability fixes — the kind of thing you notice only when it stops dropping.</li>
<li><strong>Fingerprint sign-in after cold boot.</strong> Windows Hello fingerprint readers previously demanded a password after a full shutdown in some configurations; that works again.</li>
<li><strong>Mouse stuttering.</strong> Cursor stutter on certain devices is fixed.</li>
<li><strong>File Explorer Home remembers itself.</strong> The Home view preserves its state between sessions, and keyboard shortcuts in Explorer were improved — small, but the kind of thing you use fifty times a day.</li>
</ul>
<p>Coverage of the update counts around sixteen distinct improvements; the list above is the subset most people will actually feel.</p>
<h2>Also in the pipeline</h2>
<p>The October cumulative rides on top of <strong>Windows 11 version 26H2</strong> — the 2026 feature update — which itself followed 26H1's silicon-focused release earlier in the year. Microsoft's Insider builds in mid-October also previewed a refreshed Gaming Task View inside Xbox mode, signaling that the gaming-experience work continues ahead of general release.</p>
<h2>How to get it</h2>
<p>Settings → Windows Update → Check for updates. The cumulative update installs like any other; a restart completes it. If you manage PCs for other people, the usual advice applies: let the first wave of the internet test it for a week, then deploy — though this particular release has been a quiet one.</p>
<h2>Sources</h2>
<ul>
<li>Microsoft — Windows 11 release information and update history: <a href="https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information">learn.microsoft.com/en-us/windows/release-health</a> (accessed October 31, 2026)</li>
<li>Windows 11 version 26H2 update history: <a href="https://support.microsoft.com/en-us/servicing/os/windows-11/2026/09/windows-11-version-26h2-update-history">support.microsoft.com</a> (accessed October 31, 2026)</li>
<li>BGR — Windows 11 October update improvements roundup (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'Crew-13 and the Quiet Routine of Modern Spaceflight',
    subtitle: 'Four astronauts launched to the International Space Station on October 1 — and the most remarkable thing about the mission is how unremarkable it has become.',
    category: 'Science & Innovation',
    tags: ['space', 'nasa', 'iss'],
    seoDescription: 'The Crew-13 mission launched four astronauts to the ISS on October 1, 2026. Why routine crew rotations are the real revolution in human spaceflight.',
    content: `<p>On <strong>October 1, 2026</strong>, four astronauts lifted off from Cape Canaveral aboard a SpaceX Dragon capsule, riding a Falcon 9 rocket to the International Space Station. The launch — Crew-13, NASA's latest commercial crew rotation — barely interrupted the news cycle. And that is the most important thing about it.</p>
<h2>Routine is the revolution</h2>
<p>For fifty years, human spaceflight was an event: a nation stopped, watched, and held its breath. The commercial crew program changed the grammar. Flying astronauts is now closer to a scheduled airline route than to a moonshot — the rocket launched, the first stage returned and landed at the launch site, and the crew began a months-long science mission aboard the station. Reusability is what turned the extraordinary into the ordinary: the same class of booster flies, lands, reflies.</p>
<h2>What the crew does up there</h2>
<p>An ISS rotation is not a sightseeing trip. Crews maintain a football-field-sized laboratory that runs around the clock: hundreds of experiments in biology, physics and materials science; technology demonstrations that only work in microgravity; and the unglamorous, essential work of station upkeep. Each rotation also carries the research results of the previous crew home — the station's output depends on this ferry service never skipping a quarter.</p>
<h2>The context around the mission</h2>
<p>Crew-13 flew as the station's partners — NASA, ESA, JAXA and their counterparts — have committed to operating the ISS through <strong>2030</strong>, after which NASA plans a controlled deorbit of the aging station. Every crew that launches now is also, quietly, rehearsing the handover to the commercial stations intended to follow it. The routine flights of 2026 are the bridge to whatever comes next.</p>
<h2>Worth a moment</h2>
<p>It is easy to skip a launch headline. But take ten seconds on the details: a reused booster, a spacecraft carrying people for the thirteenth operational time, a landing back at the pad. The extraordinary part of October 1 was that nothing about it was extraordinary.</p>
<h2>Sources</h2>
<ul>
<li>NASA — Commercial Crew Program mission coverage (Crew-13 launch, October 1, 2026): <a href="https://www.nasa.gov/mission/commercial-crew/">nasa.gov/mission/commercial-crew</a> (accessed October 31, 2026)</li>
<li>International Space Station transition reporting (operations through 2030), NASA OIG and partner agency statements (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'Gemini 4 Carbon Ships to Cyber Defenders First — and the Model Race Enters Its Rationing Era',
    subtitle: 'Google\u2019s newest frontier model arrived October 28 with a restricted rollout, weeks after Gemini 4 Argon — and free users got moved down a tier.',
    category: 'Artificial Intelligence',
    tags: ['ai', 'google', 'gemini'],
    seoDescription: 'Google announced Gemini 4 Carbon on October 28, 2026 with a restricted rollout to cyber defenders and trusted partners. What the rationing-era model race means for users.',
    content: `<p>On <strong>October 28, 2026</strong>, Alphabet announced <strong>Gemini 4 Carbon</strong>, its newest frontier model — and the announcement's most interesting detail wasn't a benchmark. It was the distribution: Carbon begins with a <strong>restricted rollout to cyber defenders and trusted partners</strong>, not to everyone with a browser.</p>
<h2>Why gate the launch?</h2>
<p>A model optimized for coding, agentic tasks and — notably — cyber defense is a double-edged artifact: the same capabilities that help defenders investigate intrusions could assist attackers. Gating the first wave to security teams is a deliberate safety posture, and it mirrors how other labs have handled their most agentic releases this year. Wider availability presumably follows once abuse patterns are understood.</p>
<h2>Three weeks, two frontier models</h2>
<p>Carbon arrived less than a month after <strong>Gemini 4 Argon</strong> (announced September 30), which Google positioned for real-world coding and enterprise knowledge work. Behind the scenes, the user-facing product also shifted: reports through October said free Gemini accounts were moved to Flash Lite access after Argon's release. The message to the market is clear — frontier capability is being rationed by tier and by use case, not handed out wholesale.</p>
<h2>What it means for the model race</h2>
<p>October's releases — GPT-6's mass rollout, GPT-6.1's work-first debut, Argon and Carbon's staged entrances — mark a shift in how the labs compete. The differentiator is no longer only capability but <strong>distribution strategy</strong>: who gets the model, for what job, under which safeguards. For everyday users, the practical takeaway is that free tiers now trail the frontier by design — the best models go first to paying professionals and, in Carbon's case, to the people defending networks.</p>
<h2>Sources</h2>
<ul>
<li>Google — Gemini 4 Carbon announcement (October 28, 2026) and Gemini 4 Argon announcement (September 30, 2026), as reported across multiple independent technology publications; details cross-checked via search results (accessed October 31, 2026)</li>
<li>Reporting on Gemini Apps model availability changes for personal accounts (October 2026)</li>
</ul>`,
  },
  {
    title: 'Next.js and React Shipped Emergency Security Fixes — What App Router Apps Should Do',
    subtitle: 'Two critical remote-code-execution flaws and a Server Actions denial-of-service were disclosed mid-October. If you run a Next.js app, this is your checklist.',
    category: 'Programming',
    tags: ['react', 'nextjs', 'security'],
    seoDescription: 'The October 2026 Next.js and React security disclosures included two critical RCE flaws and a Server Actions DoS. How to check your version, patch, and harden App Router apps.',
    content: `<p>On <strong>October 14–15, 2026</strong>, the Next.js and React teams disclosed and patched a set of security vulnerabilities — among them <strong>two critical remote-code-execution (RCE) flaws</strong> and a <strong>Server Actions denial-of-service</strong> issue affecting App Router applications. An out-of-band fix shipped quickly, but "patch shipped" and "I have patched" are different statements. If you operate a Next.js deployment, here is the practical version of the disclosure.</p>
<h2>What was disclosed</h2>
<ul>
<li><strong>Two critical RCE vulnerabilities</strong> — one involving typed arrays and one involving SVG processing — both exploitable in affected configurations without authentication.</li>
<li><strong>A Server Actions DoS</strong> — Server Actions are the App Router's mechanism for posting data from components to the server; the flaw let crafted requests exhaust server resources.</li>
</ul>
<p>RCE flaws in the web framework itself are the highest-stakes category in web security: they need no credentials and grant code execution on your server.</p>
<h2>The checklist</h2>
<ol>
<li><strong>Identify your exposure.</strong> Check your installed <code>next</code> and <code>react</code> versions against the advisory's affected ranges (<code>npm ls next react</code> takes ten seconds).</li>
<li><strong>Upgrade to the patched release</strong> the advisory specifies, then redeploy. Out-of-band fixes mean your package manager's "latest" may already include them — but verify the version, don't assume.</li>
<li><strong>Review logs for exploitation.</strong> Look for unexpected POSTs to Server Action endpoints and odd requests carrying malformed typed-array or SVG payloads.</li>
<li><strong>Re-examine your Server Actions surface.</strong> Every Server Action is a public endpoint; validate inputs server-side and rate-limit where it makes sense.</li>
<li><strong>Turn on automated dependency alerts</strong> if they are off — this disclosure moved fast, and humans reading changelogs were slower than a bot watching advisories.</li>
</ol>
<h2>The pattern worth remembering</h2>
<p>Modern React frameworks blur the line between frontend and backend: components run on the server, actions are endpoints, data flows in ways older mental models didn't cover. That power needs server-grade hygiene — because when the framework itself ships an RCE, your only defenses are fast patching and knowing exactly what you exposed. Both are one-time setups that pay off every disclosure season.</p>
<h2>Sources</h2>
<ul>
<li>Next.js and React security disclosures (October 14–15, 2026), as reported across multiple independent developer publications; details cross-checked via search results (accessed October 31, 2026)</li>
<li>Next.js security documentation: <a href="https://nextjs.org/docs/app/building-your-application/upgrading">nextjs.org</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'Chrome\u2019s Device-Bound Sessions Are Coming for Cookie Theft',
    subtitle: 'Session cookies are the crown jewels of account takeover. Google\u2019s Device Bound Session Credentials make them worthless to thieves — here\u2019s how that works.',
    category: 'Security & Privacy',
    tags: ['security', 'chrome', 'google'],
    seoDescription: 'Device Bound Session Credentials (DBSC) tie session cookies to your device with rotating keys, blunting cookie theft. How the Chrome security upgrade works.',
    content: `<p>Ask an incident responder what attackers want after they've phished you, and the answer is not your password — it's your <strong>session cookie</strong>. Steal it and the attacker skips login entirely, including your second factor. Google's answer, rolling into Chrome, is <strong>Device Bound Session Credentials (DBSC)</strong>: sessions that are cryptographically tied to your device and therefore worthless anywhere else.</p>
<h2>Why session cookies are the weak point</h2>
<p>Modern authentication got good at the front door: strong passwords, passkeys, MFA. So attackers moved to the side door. Infostealer malware lifts session cookies straight from the browser's storage, and the attacker replays them from their own machine — no password prompt, no MFA challenge, instant access. Enterprise security teams have watched this technique become an industry.</p>
<h2>How DBSC changes the math</h2>
<p>DBSC introduces a key pair managed by the browser in a secure hardware-backed store. When a server issues a session, it can require proof — a signature generated by that device-bound key — on an ongoing basis. Three properties fall out of this:</p>
<ul>
<li><strong>The cookie alone is not enough.</strong> Without the device's private key, a stolen session cookie fails the proof check.</li>
<li><strong>Keys rotate.</strong> Short-lived signing keys refresh regularly, so even a snapshot of session state decays quickly.</li>
<li><strong>It's server-opt-in.</strong> Sites decide to require DBSC; Chrome provides the mechanism. That means adoption is gradual — but the biggest identity providers moving first creates a ripple.</li>
</ul>
<h2>What users and developers should know</h2>
<p>For users, DBSC is invisible when it works: you stay signed in on your device, and an attacker on another device doesn't. For developers, the work is server-side — enabling DBSC challenge issuance on session establishment and handling the refresh flow. Combined with passkeys (which remove passwords entirely), the industry is steadily deleting the raw materials of account takeover: reusable secrets. Cookies were the last big one.</p>
<h2>Sources</h2>
<ul>
<li>Google Chrome Developers — Device Bound Session Credentials documentation: <a href="https://developer.chrome.com/docs/privacy-security/dbsc">developer.chrome.com/docs/privacy-security/dbsc</a> (accessed October 31, 2026)</li>
</ul>`,
  },
];
