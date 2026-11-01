import type { SeedArticle } from './types.js';

/** Evergreen how-to and programming guides — batch 3. */
export const evergreenC: SeedArticle[] = [
  {
    title: 'How to Spot a Phishing Email: the Seven Tells That Almost Never Fail',
    subtitle: 'Phishing works because it rushes you. Slow down for thirty seconds and check these seven things before you click anything.',
    category: 'How-To Guides',
    tags: ['security', 'phishing', 'email'],
    seoDescription: 'Seven reliable ways to spot a phishing email: sender domains, urgency, link destinations, unexpected attachments, greeting errors, payment changes and gut instinct.',
    content: `<p>Phishing is not a technology problem — it is a hurry problem. Every successful phish depends on the victim acting before thinking. The defense is a short checklist you can run in thirty seconds. Here are the seven tells, in the order experienced investigators check them.</p>
<h2>1. The sender's real domain</h2>
<p>Display names are free; domains are not. Hover or tap the sender and read the actual address: <code>billing@support.paypa1-secure.com</code> is not PayPal. Watch for swapped letters, extra words, and look-alike domains (<code>rnicrosoft.com</code>). If the display name says "Your Bank" but the domain is a mail host you've never heard of, stop there.</p>
<h2>2. Manufactured urgency</h2>
<p>"Your account will be closed in 24 hours." "Final notice." Real organizations do not delete your account over one unanswered email. Urgency is the phishing engine — the moment an email demands action <em>today</em>, your suspicion should be automatic.</p>
<h2>3. Where the link actually goes</h2>
<p>Hover (desktop) or long-press (mobile) any link and read the destination, not the label. A button saying "Secure Login" pointing to a random short domain is the whole con in miniature. When in doubt, don't click the email at all — open your browser and type the organization's address yourself.</p>
<h2>4. Attachments you didn't ask for</h2>
<p>Invoices, "voice messages", shipping labels — unexpected attachments are payloads. Especially beware <code>.html</code>, <code>.exe</code>, <code>.zip</code> and Office files that demand "Enable Editing" or "Enable Macros". Macros are code. Enable macros from a stranger and you've run their program.</p>
<h2>5. The greeting and the details</h2>
<p>"Dear Customer." Your bank knows your name. Real correspondence usually includes specifics — an account reference, a date, something true. Vague greetings plus vague claims is the signature of a bulk email that never knew who you were.</p>
<h2>6. Payment detail changes</h2>
<p>The costliest phish in every industry survey is the invoice scam: a legitimate-looking email from a "supplier" announcing <em>updated bank details</em>. If any email changes where money goes, verify by phone — using a number you already have, never one printed in the email itself.</p>
<h2>7. It's from someone important, out of character</h2>
<p>"CEO here, quick favor, buy gift cards." Executive impersonation works because it bypasses your suspicion with authority. Real executives can wait for a channel check. When money or credentials are involved, verify through a second channel you control.</p>
<h2>When you've spotted one</h2>
<p>Report it — to your mail provider's "report phishing" action, or to your IT team — and delete it. If you already clicked: disconnect isn't usually necessary, but change the password of whatever the page asked for, from a clean device, and enable two-factor authentication. One click is recoverable; one typed password on a fake page is the incident.</p>`,
  },
  {
    title: 'Wipe a Laptop Properly Before Selling or Giving It Away',
    subtitle: 'A factory reset is not enough on its own. Here is the order of operations that protects your accounts, your files and your buyer.',
    category: 'How-To Guides',
    tags: ['windows', 'privacy', 'how-to'],
    seoDescription: 'How to securely wipe a laptop before selling: deauthorize accounts, sign out everywhere, reset with a full clean install, and what to do about the drive afterwards.',
    content: `<p>Selling or giving away a laptop without wiping it properly is handing a stranger your digital life: saved sessions, autofilled passwords, tax documents, photos. The fix is an afternoon of unglamorous steps, in this order.</p>
<h2>Step 1: Back up first, obviously</h2>
<p>Copy everything you want to keep to an external drive or cloud storage — documents, photos, browser bookmarks, and license keys for software you'll reinstall elsewhere. Check the Downloads and Desktop folders; that's where the irreplaceable stuff hides.</p>
<h2>Step 2: Deauthorize and sign out</h2>
<p>Many services limit how many devices can stay signed in — iTunes/Apple ID, Adobe, Office, game launchers, password managers. Deauthorize the machine from each. Then sign out of your Microsoft/Google account in the system settings. Skipping this step is why new owners sometimes find the old owner's stuff syncing back.</p>
<h2>Step 3: Turn off Find My / activation locks</h2>
<p>On machines with BIOS-level locks or attached device accounts, disable "Find my device" and any activation lock. A locked laptop is worthless to its new owner and a support ticket for you.</p>
<h2>Step 4: Reset — the right way</h2>
<p>On Windows: Settings → System → Recovery → Reset this PC, choosing <strong>Remove everything</strong>, and select <strong>Clean the drive</strong> (not "Just remove my files") — that writes over the data so file-recovery tools can't simply read it back. On macOS: use the Erase All Content and Settings assistant on Apple-silicon and recent Intel Macs; older Macs need recovery-mode Disk Utility with the same security level.</p>
<h2>Step 5: The drive question</h2>
<p>For most sellers, a full reset with drive-cleaning is sufficient. If the laptop held genuinely sensitive data — client records, financial work — the paranoid-correct option is removing the drive entirely (kept or physically destroyed) and selling the laptop without one, or wiping with a dedicated tool that overwrites the whole disk. Solid-state drives complicate classic "write zeros" advice; the vendor's secure-erase utility or the built-in reset is the modern answer.</p>
<h2>Step 6: Fresh install for the buyer</h2>
<p>After the reset, let the machine land on its out-of-box screen and stop there — the new owner sets up their own account. A clean, logged-out, activated laptop with its charger is what "good condition" actually means.</p>
<h2>One last sweep</h2>
<p>Before it leaves your house: check the browser for saved passwords one final time, empty the recycle bin, and physically check the SD card slot and DVD tray. It is astonishing how often the secret lives on a card still in the machine.</p>`,
  },
  {
    title: 'Back Up Your Phone the Right Way (Android and iPhone)',
    subtitle: 'A phone backup that has never been tested is a hope, not a plan. Here is what to back up, what each platform covers, and how to prove it works.',
    category: 'How-To Guides',
    tags: ['android', 'iphone', 'backup'],
    seoDescription: 'How to back up Android and iPhone properly: what cloud backups include and miss, how to protect photos and chats, and how to test that your backup actually restores.',
    content: `<p>Most people "have" a phone backup in the sense that some toggle is on somewhere. Then the phone dies, the replacement restores contacts and apps — and the photos from the last six months are gone. Here is what each platform actually covers, what it misses, and how to make a backup you can trust.</p>
<h2>iPhone: iCloud and its gaps</h2>
<p>With iCloud Backup enabled (Settings → your name → iCloud → iCloud Backup), your device backs up daily over Wi-Fi when locked and charging. It covers app data, device settings, messages and photos <strong>only if iCloud Photos is separately enabled</strong> — the photo library is its own toggle and its own storage bill. What iCloud Backup does <em>not</em> include: data for apps that opted out, and anything already synced elsewhere. Check Settings → General → iPhone Storage and the iCloud backup date; "Last successful backup: today" is the whole health check.</p>
<h2>Android: Google One and the same trap</h2>
<p>Google's backup (Settings → Google → Backup) covers apps, SMS, call history, device settings and contacts. Photos depend on Google Photos' own backup toggle. Two gaps surprise people: WhatsApp media is only included if WhatsApp's own Google Drive backup is enabled inside WhatsApp's settings, and app-internal data varies by developer. Verify in the same menu — the timestamp is the truth.</p>
<h2>The three things cloud backups routinely miss</h2>
<ol>
<li><strong>Two-factor authenticator codes</strong> — unless you enable the platform's backup (Google Authenticator cloud sync, or iCloud Keychain for codes), a lost phone can lock you out of everything. This is the backup-of-the-backup.</li>
<li><strong>Chat media outside default settings</strong> — WhatsApp, Signal and Telegram each have their own backup systems with their own toggles. Check each app, not just the OS.</li>
<li><strong>Files stored only in "On My Phone" locations</strong> — documents saved into app-private storage are invisible to cloud sync until you move them.</li>
</ol>
<h2>Test it like you mean it</h2>
<p>Once a year, restore your backup to an old device or an emulator and check: photos present? messages there? authenticator codes working? Thirty uncomfortable minutes that turn a disaster into an inconvenience. A backup that has never been restored is a rumor.</p>
<h2>For the extra careful</h2>
<p>Add one offline layer: a monthly copy of photos to a computer or external drive. Cloud services lose accounts to accidental deletion and lockouts; an offline copy is the version of your life that no password reset can take away.</p>`,
  },
  {
    title: 'Take Control of Windows Privacy Settings in 20 Minutes',
    subtitle: 'Windows installs with a lot of telemetry and "helpful" features switched on. Here is the honest, settings-only tour — no third-party tools required.',
    category: 'How-To Guides',
    tags: ['windows', 'privacy', 'settings'],
    seoDescription: 'A 20-minute tour of Windows privacy settings: telemetry, advertising ID, activity history, app permissions, location and diagnostics — what each does and what to turn off.',
    content: `<p>Windows 11 ships with telemetry, suggestions and advertising identifiers enabled, because the defaults serve Microsoft's product goals. None of it is sinister by the standards of modern software — but if you'd rather the OS ask first, twenty minutes in Settings covers the meaningful choices. No third-party "debloat" tools needed; those tend to break updates.</p>
<h2>Privacy & security — the main page</h2>
<p>Settings → Privacy & security. Work top to bottom:</p>
<ul>
<li><strong>General:</strong> turn off "Let apps show me personalized ads" (this kills the advertising ID), "Let websites provide locally relevant content", and the tailored-experience toggles unless you want them.</li>
<li><strong>Speech</strong> and <strong>Inking & typing personalization</strong> — off unless you use those features deliberately.</li>
<li><strong>Diagnostics & feedback:</strong> set diagnostic data to "Required diagnostic data" (the minimum Microsoft accepts), and turn off tailored experiences and the feedback frequency.</li>
<li><strong>Activity history:</strong> clear what's stored and stop sending your activity timeline if you don't use timeline features.</li>
</ul>
<h2>App permissions</h2>
<p>Still under Privacy & security, the App permissions section lists location, camera, microphone, contacts and more. Two moves: review <strong>Location</strong> (turn off entirely if you don't use maps/weather, or prune per-app), and prune <strong>Camera and microphone</strong> — anything unexpected with access deserves a click.</p>
<h2>The browser and the account</h2>
<p>Windows' privacy is entangled with your Microsoft account's sync settings: Settings → Accounts → Windows backup controls what syncs. If you keep sync on for convenience, you've made a fair trade — but know that's the choice. In the browser, Edge's own privacy settings (tracking prevention set to Balanced or Strict) are a separate layer worth a minute.</p>
<h2>What not to do</h2>
<p>Skip the registry-hack "telemetry killer" scripts from random forums. They break Windows Update, get partially reverted by feature updates anyway, and create support headaches. The Settings app covers everything that genuinely matters, survives upgrades, and costs you twenty minutes once.</p>
<h2>The payoff</h2>
<p>Honest expectation: Windows will still phone home about security and core diagnostics — that's part of keeping a billion machines patched. What you'll have removed is the advertising identifier, the personalization pipelines and the optional data collection. That's the difference between "the OS has telemetry" and "the OS is learning about me specifically."</p>`,
  },
  {
    title: 'Browser Profiles: One Browser, Many Clean Rooms',
    subtitle: 'Work, personal, client projects, that one account you keep logged out of — browser profiles give each its own cookies, history and extensions. Here\u2019s how to use them well.',
    category: 'How-To Guides',
    tags: ['browsers', 'productivity', 'privacy'],
    seoDescription: 'Browser profiles explained: separate work and personal cookies, extensions and history in Chrome, Edge or Firefox — with practical setups and what profiles do not protect against.',
    content: `<p>Most people use one browser profile for everything: work email next to personal shopping next to that admin panel for a side project. Browser profiles — built into Chrome, Edge, Firefox and Safari (lightly) — split all of that into separate rooms. Same browser, separate cookies, extensions, history, passwords and sessions.</p>
<h2>What a profile actually isolates</h2>
<ul>
<li><strong>Cookies and sessions:</strong> logging into Gmail on your work profile doesn't touch your personal one.</li>
<li><strong>Extensions:</strong> work profile gets the corporate SSO extension; personal profile keeps the shopping helper. Fewer extensions per profile also means faster browsing and a smaller attack surface.</li>
<li><strong>History and autofill:</strong> no cross-contamination of suggestions, and no leaking one context's browsing into another's autocomplete.</li>
<li><strong>Sync accounts:</strong> each profile can sync to a different account entirely.</li>
</ul>
<h2>Practical setups that earn their keep</h2>
<ul>
<li><strong>Work / personal split</strong> — the classic. Two rooms, zero accidental cross-posting, and end-of-work is literally closing a window.</li>
<li><strong>Client profiles</strong> — agencies and freelancers keep one profile per client: separate logins to the same tools, clean history for billing, no cookie collisions between staging environments.</li>
<li><strong>A "banking only" profile</strong> with zero extensions and nothing else installed — the cleanest environment for the accounts that matter most.</li>
<li><strong>A testing profile</strong> — developers already live this: a fresh profile behaves like a new user, which is exactly what debugging login flows requires.</li>
</ul>
<h2>How to start</h2>
<p>In Chrome or Edge: click the profile avatar (top-right) → Add profile. Firefox: the profile manager is under <code>about:profiles</code>. Name profiles by role, pick a color, and sign each into its own sync account if you use one.</p>
<h2>Honest limits</h2>
<p>Profiles are organization, not security: malware on your machine sees all profiles, and a profile does not make reused passwords safe. They also don't hide activity from your employer on a managed device. What they do — context separation, cookie isolation, mental clarity — they do extremely well, for the price of one avatar click.</p>`,
  },
  {
    title: 'TypeScript for JavaScript Developers: the Five Wins That Make It Click',
    subtitle: 'TypeScript is not a different language — it\u2019s JavaScript with the mistakes caught earlier. The five places it pays for itself immediately.',
    category: 'Programming',
    tags: ['typescript', 'javascript', 'web-development'],
    seoDescription: 'Five practical wins TypeScript gives JavaScript developers immediately: autocomplete, refactoring, catching typos, self-documenting functions, and safer refactors of legacy code.',
    content: `<p>TypeScript has a reputation problem among JavaScript developers who haven't tried it: it sounds like ceremony — types, interfaces, generics, build steps. In practice, the first week delivers five concrete wins that make the case better than any type theory.</p>
<h2>Win 1: Autocomplete that knows your data</h2>
<p>When a function returns a typed object, your editor completes its fields. No more opening the API response in the console to remember whether it's <code>user.id</code> or <code>user.userId</code>. This is the feature that hooks most developers — it makes the codebase self-describing.</p>
<h2>Win 2: Typos become compile errors, not 2 a.m. incidents</h2>
<p><code>user.nam</code> in plain JavaScript is <code>undefined</code> discovered in production. In TypeScript, it's a red underline before you save. The class of bug called "property doesn't exist" simply stops reaching your users.</p>
<h2>Win 3: Refactoring stops being archaeology</h2>
<p>Rename a field on a type and TypeScript lists every place that needs updating — across every file. In a dynamic codebase the same refactor means full-text searching for strings and hoping. Teams report that large refactors go from "risky quarter" to "an afternoon" once types exist.</p>
<h2>Win 4: Function signatures become documentation the compiler enforces</h2>
<p>A typed signature — <code>function createInvoice(customer: Customer, items: LineItem[], dueDate?: Date)</code> — tells you exactly what to pass, and rejects what you shouldn't. JSDoc comments rot; signatures can't.</p>
<h2>Win 5: Legacy code gets safer gradually</h2>
<p>TypeScript's <code>strict: false</code> starting point lets you adopt incrementally: rename files to <code>.ts</code> one at a time, type the boundaries (API responses, config objects) first, and let the compiler fill in the rest. You don't have to type the whole codebase on day one to get value on day one.</p>
<h2>What it costs (honestly)</h2>
<p>There's a learning curve around generics and the occasional type gymnastics, and a build step to add. For most projects the balance is lopsided: the compiler catches a category of bug that previously cost production incidents, in exchange for some annotations at the boundaries. Start with <code>strict: false</code>, type your API layer, and turn strictness up as the codebase earns it.</p>`,
  },
  {
    title: 'CSS Grid vs Flexbox: Stop Guessing, Start Choosing',
    subtitle: 'The two layout systems answer different questions. One question tells you which to reach for — and the answer is almost never "the one I know better."',
    category: 'Programming',
    tags: ['css', 'web-development', 'frontend'],
    seoDescription: 'CSS Grid vs Flexbox explained by intent: Grid for two-dimensional page structure, Flexbox for one-dimensional content flow — with practical patterns for each.',
    content: `<p>The eternal frontend question has a one-line answer: <strong>Flexbox lays out content along one axis; Grid lays out structure along two.</strong> Everything else is detail. Ask "am I arranging items in a row or column, where they size themselves?" — that's Flexbox. Ask "am I designing the regions of a page or component, with items placed into fixed tracks?" — that's Grid.</p>
<h2>Reach for Flexbox when content decides the layout</h2>
<ul>
<li><strong>Toolbars and button rows:</strong> items flow in a line, wrap if needed, space themselves with <code>gap</code> and <code>justify-content</code>.</li>
<li><strong>Vertical stacking with variable content:</strong> cards whose heights differ, sidebars beside a main area where the sidebar sizes to its content.</li>
<li><strong>Aligning one item against another:</strong> <code>margin-left: auto</code> for the "push to the right" move, <code>align-items: center</code> for vertical centering — Flexbox's alignment model is why people stopped using floats entirely.</li>
<li><strong>Nav bars, form rows, tag clouds, breadcrumbs.</strong></li>
</ul>
<h2>Reach for Grid when the design decides the layout</h2>
<ul>
<li><strong>Page scaffolding:</strong> header, sidebar, main and footer as named regions that hold their positions regardless of content.</li>
<li><strong>Card galleries:</strong> <code>repeat(auto-fill, minmax(280px, 1fr))</code> gives a responsive gallery in one line — no media queries needed.</li>
<li><strong>Forms and settings panels:</strong> label and field columns that stay aligned across rows.</li>
<li><strong>Anything where an element must span tracks</strong> (<code>grid-column: span 2</code>) or overlap another.</li>
</ul>
<h2>The tell-tale signs you picked wrong</h2>
<p>Flexbox in a two-dimensional design produces <code>margin-top: auto</code> hacks, nested wrappers to fake columns, and items that won't align across rows. Grid on a one-dimensional flow produces empty track definitions and awkward <code>grid-auto-flow</code> fixes. When you fight the tool, you picked the wrong tool.</p>
<h2>They're colleagues, not rivals</h2>
<p>The strongest pattern is composition: Grid for the page frame, Flexbox inside each region for its contents. A Grid card gallery where each card's internal layout is a small Flexbox column is not a compromise — it's the idiomatic answer to both questions at once. Learn which question you're answering, and the choice stops being a debate.</p>`,
  },
  {
    title: 'Why Your Database Query Is Slow: Indexes, Explained with a Library',
    subtitle: 'A slow query is almost always a scan hiding in plain sight. How indexes work, why yours might be ignored, and the two queries that diagnose 90% of problems.',
    category: 'Programming',
    tags: ['databases', 'postgresql', 'backend'],
    seoDescription: 'How database indexes work (explained with a library), why the planner ignores some indexes, and how EXPLAIN ANALYZE finds the real problem in slow queries.',
    content: `<p>"The query is slow" is almost never a mystery. Ninety percent of slow queries are the same story: the database read far more rows than the result needed. The fix is usually an index — and understanding why indexes work (and when they don't) turns performance tuning from folklore into engineering.</p>
<h2>The library model</h2>
<p>Imagine a library with a million books and no catalog. To find every book about "database indexes," you check all million covers. That is a <strong>sequential scan</strong> — the default behavior of a query on an unindexed column.</p>
<p>An index is the catalog: a sorted structure (a B-tree, in Postgres, MySQL and most engines) that lets the engine jump straight to matching entries. Add an index on <code>books.subject</code> and the same query reads ten entries instead of a million. Sorted structure, binary search, done.</p>
<h2>Why indexes get ignored</h2>
<p>Plenty of tables have indexes and still crawl, for predictable reasons:</p>
<ul>
<li><strong>Functions on the indexed column:</strong> <code>WHERE lower(email) = '...'</code> can't use a plain index on <code>email</code> — either index the expression or compare without transforming.</li>
<li><strong>Leading wildcards:</strong> <code>LIKE '%smith'</code> can't use the sorted structure; <code>'smith%'</code> can.</li>
<li><strong>Type mismatches:</strong> comparing a text column to a number quietly defeats the index.</li>
<li><strong>Selecting everything anyway:</strong> if the query returns most of the table, a scan <em>is</em> the fast plan — indexes help targeted queries, not exports.</li>
<li><strong>Low-selectivity columns:</strong> an index on <code>is_active</code> (true/false) matches half the table; the planner rightly ignores it.</li>
</ul>
<h2>The two diagnostic queries</h2>
<p>Stop guessing and ask the planner. In Postgres, <code>EXPLAIN ANALYZE SELECT ...</code> runs the query and reports what it actually did — scan type, rows examined, time per step. Read it top to bottom: every "Seq Scan" on a large table where you expected an "Index Scan" is a suspect. Look for "rows removed by filter" — a large number there is the scanning smell.</p>
<h2>Rules of thumb that hold up</h2>
<ul>
<li>Index the columns you filter and join on, prioritizing the ones in <code>WHERE</code> clauses of your hottest queries.</li>
<li>Composite indexes respect column order — <code>(user_id, created_at)</code> serves queries filtering by user, but not by date alone.</li>
<li>Every index slows writes slightly; don't index speculatively. Add one when a slow query proves the need, and measure with EXPLAIN again.</li>
</ul>
<p>With that loop — EXPLAIN, read the scan type, add the right index, EXPLAIN again — most "the database is slow" tickets resolve in an afternoon.</p>`,
  },
  {
    title: 'REST API Design: Naming, Status Codes and Pagination Done Right',
    subtitle: 'A good API is boring in the best way: predictable URLs, honest status codes and pagination that never surprises the client. The conventions that matter.',
    category: 'Programming',
    tags: ['api', 'backend', 'web-development'],
    seoDescription: 'REST API design conventions that hold up: resource naming, correct HTTP status codes, pagination strategies, filtering and versioning — with practical examples.',
    content: `<p>A REST API's quality is measured by how much the client developer has to guess. The conventions below aren't pedantry — they're what makes an API predictable across teams, years and dozens of endpoints.</p>
<h2>Naming: nouns for things, never verbs for actions</h2>
<p>URLs name <strong>resources</strong>; HTTP methods are the verbs. <code>GET /articles/42</code>, <code>PATCH /articles/42</code>, <code>DELETE /articles/42</code> — not <code>/getArticle</code>, <code>/deleteArticle?id=42</code>. Plural nouns read best: <code>/users</code>, <code>/users/7/orders</code>. Nested routes express ownership; one level of nesting is usually enough — <code>/users/7/orders</code> is fine, <code>/users/7/orders/3/items/9</code> is a path you'll regret.</p>
<h2>Status codes: tell the truth</h2>
<ul>
<li><strong>200</strong> for success with a body, <strong>201</strong> for created (return the new resource), <strong>204</strong> for success with no body.</li>
<li><strong>400</strong> for malformed requests, <strong>401</strong> for missing/invalid authentication, <strong>403</strong> for "authenticated but not allowed", <strong>404</strong> for missing resources — including ones you're hiding for permission reasons.</li>
<li><strong>409</strong> for conflicts (duplicate email), <strong>422</strong> for validation failures, <strong>429</strong> for rate limiting.</li>
<li><strong>500</strong> for your bugs — and never leak stack traces into it.</li>
</ul>
<p>The classic sin is returning 200 with <code>{"error": "..."}</code> in the body. Clients then need a per-endpoint convention to detect failure — exactly what status codes existed to prevent.</p>
<h2>Pagination: always, even on day one</h2>
<p>Endpoints that return unbounded lists will eventually return a hundred thousand rows and take the server down. Two standard strategies:</p>
<ul>
<li><strong>Offset pagination</strong> (<code>?page=2&perPage=20</code>): simple, jumpable, but drifts when rows are inserted mid-scroll.</li>
<li><strong>Cursor pagination</strong> (<code>?cursor=eyJpZCI6NDJ9</code>): stable under inserts, slightly less human-friendly. The right choice for feeds and high-write tables.</li>
</ul>
<p>Either way, return metadata — total count or next-cursor — and enforce a maximum page size server-side.</p>
<h2>Errors worth reading</h2>
<p>A good error response has a stable machine-readable code, a human message, and field-level details for validation failures: <code>{"error": {"code": "VALIDATION_ERROR", "message": "Invalid input", "details": {"email": ["already in use"]}}}</code>. Client teams build one handler for that shape and it works for every endpoint forever.</p>
<h2>Versioning: the escape hatch</h2>
<p>Prefix paths (<code>/api/v1/…</code>) and never break a shipped version — add fields freely, remove or rename only in a new version. The moment two clients exist, your API is a product; versioning is how you upgrade it without holding users hostage.</p>`,
  },
  {
    title: 'The Testing Pyramid, Explained Without Jargon',
    subtitle: 'Why most tests should be small and fast, few should be slow, and the handful in between are the ones teams always skip. A practical shape for real projects.',
    category: 'Programming',
    tags: ['testing', 'engineering', 'beginners'],
    seoDescription: 'The testing pyramid explained simply: many unit tests, fewer integration tests, a handful of end-to-end tests — what each layer catches and the mistakes teams make.',
    content: `<p>The testing pyramid is one drawing that prevents years of pain: <strong>many small tests at the bottom, fewer in the middle, a handful at the top.</strong> Each layer catches a different kind of bug at a different cost. Most teams' testing failures come from building the pyramid upside down.</p>
<h2>The bottom layer: unit tests (the many)</h2>
<p>Unit tests exercise one function or class in isolation — inputs to outputs, no network, no database. They run in milliseconds, which means they run constantly: on every save, every commit. They pin down logic: validators, calculators, string munging, state machines. Because they're cheap, you can afford hundreds — and each one is a permanent regression alarm. If a bug reaches production from a function, the fix comes with a unit test so that function can never lie again.</p>
<h2>The middle layer: integration tests (the few)</h2>
<p>Unit tests say nothing about whether the pieces fit. Integration tests exercise real combinations: your API against a real database, a request with authentication, a write that touches three tables. They're slower (seconds) and they need infrastructure, so you keep a curated set: one per critical flow — "user can register," "order can be created," "login rejects bad credentials." This is the layer that catches what units can't: wrong assumptions between components, broken transactions, missing indexes on real data volumes.</p>
<h2>The top layer: end-to-end tests (the handful)</h2>
<p>E2E tests drive a real browser through a real user journey: load the site, register, create a post, see it appear. They're the slowest and the most fragile — any UI tweak can break a selector — which is why the pyramid keeps them few: the five journeys you cannot afford to break, run before every release. Ten E2E tests maintained with love beat fifty that fail randomly and get ignored.</p>
<h2>The upside-down pyramid (the common mistake)</h2>
<p>Teams under deadline pressure skip unit tests and "cover" everything with E2E. The result: a suite that takes an hour, fails randomly, gets a retry button, and eventually gets ignored. Testing then collapses entirely. The pyramid's shape is a budget: put your volume where tests are cheap and your confidence where they're decisive.</p>
<h2>Starting from zero</h2>
<ol>
<li>Pick your most bug-prone pure function and write three unit tests for it.</li>
<li>Add one integration test for your app's most critical flow.</li>
<li>Add one E2E test for "the product works at all."</li>
<li>Require a test with every bug fix, forever. The suite builds itself from your mistakes.</li>
</ol>`,
  },
];
