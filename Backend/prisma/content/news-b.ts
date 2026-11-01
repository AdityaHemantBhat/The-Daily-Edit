import type { SeedArticle } from './types.js';

/** Verified news articles, part two. Sources inspected 2026-10-31. */
export const newsB: SeedArticle[] = [
  {
    title: 'PostgreSQL 19 Slips to November 19 — and the Release Candidate Tells You Exactly What Survived',
    subtitle: 'RC 1 landed October 15 with a leaner feature set after a difficult beta cycle. Here is what is actually shipping in the next major Postgres.',
    category: 'Software',
    tags: ['postgresql', 'databases'],
    seoDescription: 'PostgreSQL 19 RC 1 (October 15, 2026) sets GA for November 19. What made the cut — REPACK CONCURRENTLY, planner advice, parallel autovacuum — and what did not.',
    content: `<p>The PostgreSQL Global Development Group published <strong>Release Candidate 1 for PostgreSQL 19 on October 15, 2026</strong>, and set the general-availability date at <strong>November 19, 2026</strong> — a few weeks later than the community's customary early-autumn slot. The RC announcement is unusually informative: it lists, category by category, the fixes that landed since Beta 4, which is effectively the final shape of the release.</p>
<h2>Why the delay was worth it</h2>
<p>Postgres release cycles occasionally need extra time, and 19's did. Multiple reports during September and October described a late-cycle cleanup in which several features were pulled or reverted — SQL/PGQ property-graph queries and MERGE PARTITIONS being the most-cited names — after review surfaced architectural problems. We could not inspect every secondary report directly, so treat the exact count with care; what matters is confirmed by the primary source: the RC ships <em>without</em> those contested items, and the release team built in an RC 2 on <strong>November 12</strong> to fold in fixes from that day's quarterly update release.</p>
<h2>What is actually in RC 1</h2>
<p>Reading the "changes since Beta 4" list tells you where the release's center of gravity is: operations, not spectacle.</p>
<ul>
<li><strong>REPACK (CONCURRENTLY)</strong> — a built-in online table-repacking capability (think pg_repack, without the extension) received multiple fixes. This is the feature many DBAs will upgrade for.</li>
<li><strong>pg_plan_advice</strong> — the planner-advisor framework that makes query hints a supportable concept got further hardening.</li>
<li><strong>Parallel autovacuum</strong> — multiple fixes, reflecting how central vacuum throughput is to large-database operations.</li>
<li><strong>Observability</strong> — new reporting around lock waits, WAL and I/O, plus fixes for planner optimizations that depend on expression nullability. (Four new system views covering lock contention, recovery state, autovacuum priorities and dynamic shared memory were part of this release's observability push.)</li>
<li><strong>Logical replication</strong> — fixes including automatic enablement when <code>wal_level</code> is set to <code>replica</code>.</li>
<li><strong>Small but delightful:</strong> <code>COPY (query) TO ... (FORMAT json)</code> now uses the query's column names — including aliases — as JSON keys, instead of the table's column names. Anyone who has wrapped a view in COPY will feel that one.</li>
</ul>
<h2>One more reason to watch the calendar</h2>
<p>PostgreSQL 14 — a widely deployed release — reaches end of life on <strong>November 12, 2026</strong>, a week before 19 ships. If your upgrade plan involves skipping from 14 to 19, both dates belong on the same calendar entry, because the required tooling (pg_upgrade, or pg_dump/pg_restore) is the same conversation.</p>
<h2>Should you plan for day-one adoption?</h2>
<p>The honest answer for most production estates: install RC 1 in staging now, exercise your real workloads and failover runbooks, and schedule production upgrades shortly after November 19 rather than on it. Major-version upgrades require <code>pg_upgrade</code> or dump-and-restore either way, so the migration planning you do today is not wasted. If you run Postgres behind a managed service, your provider's timeline governs — but the feature list above is what you will be getting.</p>
<h2>Sources</h2>
<ul>
<li>PostgreSQL Global Development Group — "PostgreSQL 19 RC 1 Released!" (October 15, 2026): <a href="https://www.postgresql.org/about/news/postgresql-19-rc-1-released-3409/">postgresql.org/about/news/postgresql-19-rc-1-released-3409</a> (accessed October 31, 2026)</li>
<li>PostgreSQL 19 upgrading documentation: <a href="https://www.postgresql.org/docs/19/upgrading.html">postgresql.org/docs/19/upgrading.html</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'CISA Confirms Active Exploitation of Citrix NetScaler Zero-Days — 22,000 Devices Are Exposed',
    subtitle: 'Two unauthenticated remote-code-execution flaws (CVSS 9.5) landed in CISA\u2019s Known Exploited Vulnerabilities catalog on September 27. If you run NetScaler, the patch window is already late.',
    category: 'Security & Privacy',
    tags: ['security', 'vulnerabilities', 'cisa'],
    seoDescription: 'CISA confirmed active exploitation of Citrix NetScaler zero-days CVE-2026-88771 and CVE-2026-88772 (CVSS 9.5, unauthenticated RCE). Patch guidance and indicators to check.',
    content: `<p>Every few months a perimeter device becomes the story, and this cycle it is Citrix NetScaler. On <strong>September 27, 2026</strong>, the U.S. Cybersecurity and Infrastructure Security Agency (CISA) added two critical NetScaler vulnerabilities to its Known Exploited Vulnerabilities (KEV) catalog and published an alert — updated through October 9 — confirming that threat actors are actively exploiting them globally.</p>
<h2>What the flaws are</h2>
<p>The two vulnerabilities, tracked as <strong>CVE-2026-88771</strong> and <strong>CVE-2026-88772</strong>, are remote code execution bugs in NetScaler ADC and NetScaler Gateway, both rated <strong>CVSS 9.5</strong>. The detail that turns "critical" into "urgent" is the exploitation model: they can be triggered <strong>remotely, without authentication and without user interaction</strong>. There is no phishing email to catch and no credential to steal — a vulnerable appliance exposed to the internet is an open door.</p>
<h2>Why NetScaler appliances keep making headlines</h2>
<p>NetScaler (formerly Citrix ADC) sits at the edge of a lot of corporate networks, terminating VPN connections and load-balancing internal applications. Edge devices are attractive targets precisely because they are designed to talk to strangers: they hold authentication sessions, they are reachable from anywhere, and they often cannot be patched on a workstation's timetable. Internet-wide scanning routinely finds tens of thousands of NetScaler devices exposed — roughly <strong>22,000</strong> in recent counts of potentially vulnerable instances.</p>
<p>This is also a repeat pattern for the product line. Another NetScaler flaw, CVE-2026-19490, joined the KEV catalog in mid-September even though the vendor's original August advisory had not flagged active exploitation — a reminder that "not yet exploited" in a patch Tuesday note is a status, not a promise.</p>
<h2>What organizations should do now</h2>
<ul>
<li><strong>Apply Citrix's CTX697096 patches immediately.</strong> CISA's KEV listing carries a federal patching deadline, but the deadline that matters is your own: unauthenticated RCE on an edge device is an emergency, not a backlog item.</li>
<li><strong>Hunt before you assume you are clean.</strong> Check appliance logs for unexpected administrative sessions, new or modified Gateway policies, and outbound connections you cannot explain. For edge devices, assume persistence attempts until proven otherwise.</li>
<li><strong>Reduce exposure.</strong> Management interfaces should never face the internet, and appliances that do not strictly need public reachability should not have it. The ~22,000 exposed-device figure is, in effect, a to-do list for somebody.</li>
<li><strong>Subscribe to CISA alerts for your vendors.</strong> The KEV catalog exists precisely so that prioritization is not a judgment call — if a flaw lands there, it is being used by someone, today.</li>
</ul>
<h2>The takeaway for everyone else</h2>
<p>You may not run NetScaler, but the playbook in this incident generalizes: internet-facing infrastructure with unauthenticated RCE bugs gets exploited within days, vendor advisories lag reality, and the organizations that fare best are the ones that treat KEV listings as automatic priorities. The effort you spend making edge-device patching fast and boring is never wasted.</p>
<h2>Sources</h2>
<ul>
<li>CISA — "Critical Zero-Day Vulnerabilities Exploited in Citrix NetScaler ADC | Gateway" (alert dated September 27, 2026; updated October 9, 2026): <a href="https://www.cisa.gov/news-events/alerts/2026/09/27/critical-zero-day-vulnerabilities-exploited-citrix-netscaler-adc-gateway">cisa.gov/news-events/alerts/2026/09/27</a> (accessed October 31, 2026)</li>
<li>Citrix security advisory CTX697096 (via the CISA alert above)</li>
</ul>`,
  },
  {
    title: 'The 2026 Nobel Prize in Physics Goes to the Man Who Froze a Telescope Into Antarctic Ice',
    subtitle: 'Francis Halzen won for IceCube — the observatory that turned a cubic kilometer of Antarctic ice into humanity\u2019s best neutrino detector. Here is how it works.',
    category: 'Science & Innovation',
    tags: ['physics', 'space', 'nobel-prize'],
    seoDescription: 'The 2026 Nobel Prize in Physics recognized Francis Halzen for IceCube and the discovery of high-energy astrophysical neutrinos. How a cubic kilometer of ice detects ghost particles.',
    content: `<p>The 2026 Nobel Prize in Physics was awarded to <strong>Francis Halzen</strong> "for decisive contributions to the IceCube Neutrino Observatory and the discovery of high-energy neutrinos of astrophysical origin" — the Royal Swedish Academy of Sciences' recognition of one of the most improbable observatories ever built: a cubic kilometer of Antarctic ice, a mile beneath the South Pole, watching for ghost particles from exploding stars and feeding black holes.</p>
<h2>Why neutrinos are worth the trouble</h2>
<p>Neutrinos are the universe's introverts. Trillions pass through your body every second, and nearly all of them sail on through the planet without interacting with anything. They are produced by the sun, by cosmic rays striking the atmosphere, and — crucially — by the universe's most violent engines: supernovae, active galactic nuclei, and the cosmic accelerators that hurl particles to energies no human-made collider can match.</p>
<p>That aloofness is exactly what makes them scientifically precious. Light is absorbed and scattered by dust and magnetic fields; charged particles are deflected by interstellar magnetism. A neutrino, once created, travels in an essentially straight line for billions of light-years. Point back along its path and you know where in the sky it came from. Neutrinos are, in other words, the only straight-line messengers from the most extreme places in the cosmos — if you can catch them.</p>
<h2>The IceCube idea: use the planet as a filter</h2>
<p>Halzen's insight, championed for decades against healthy skepticism, was that the best way to catch a particle that almost never interacts is to watch an absurdly large amount of matter. IceCube embeds more than <strong>5,000 light sensors on strings dropped into boreholes</strong> drilled between 1.5 and 2.5 kilometers into the Antarctic ice cap, instrumenting a cubic kilometer of exceptionally clear, bubble-free ice.</p>
<p>The detector rarely sees neutrinos directly. Instead it watches for <strong>Cherenkov light</strong>: on the rare occasions when a neutrino collides with an atom inside the instrumented volume, it produces a charged secondary particle that outruns light <em>in ice</em>, dragging a cone of faint blue light behind it. IceCube's sensors timestamp those photons with nanosecond precision, and from millions of such events, algorithms reconstruct direction and energy.</p>
<h2>What IceCube discovered</h2>
<p>For years IceCube saw atmospheric neutrinos — useful for physics, but not the prize-winning quarry. The breakthrough came with <strong>high-energy astrophysical neutrinos</strong>: particles with energies far above any atmospheric source, arriving from random directions across the sky at rates proving they were born in cosmic accelerators far beyond the galaxy. Later came the observations that made headlines — neutrinos correlated with a flaring blazar billions of light-years away, giving astronomy its first neutrino-based pointer to a specific cosmic engine.</p>
<h2>Why the method matters beyond one prize</h2>
<p>IceCube pioneered a template now spreading through physics: use the planet itself — ice, ocean, and eventually the moon — as a detector volume. Its data flows into multi-messenger astronomy, where neutrino alerts trigger telescopes within minutes. The 2026 prize is, in a sense, an award for patience at scale: a detector built for maybe a hundred events a year that rewrote what astronomy can see.</p>
<h2>Sources</h2>
<ul>
<li>The Nobel Prize — 2026 Nobel Prize in Physics, Francis Halzen, official summary: <a href="https://www.nobelprize.org/prizes/physics/2026/summary/">nobelprize.org/prizes/physics/2026/summary</a> (accessed October 31, 2026)</li>
</ul>`,
  },
  {
    title: 'GPT-6 Rolls Out to All of ChatGPT — 1.2 Billion Users and an \u201cIntelligent UI\u201d',
    subtitle: 'OpenAI\u2019s October 7 announcement brought GPT-6 to every user tier within two days, introduced widget-based responses, and set up the month\u2019s follow-up with GPT-6.1.',
    category: 'Artificial Intelligence',
    tags: ['ai', 'openai', 'chatgpt'],
    seoDescription: 'OpenAI rolled GPT-6 out to all ChatGPT users on October 7\u20138, 2026, introducing an Intelligent UI with visual, interactive responses. What changed and what it means for daily use.',
    content: `<p>OpenAI used an October 7 announcement — titled, without much modesty, "GPT-6 for everyone" — to make its flagship model available across ChatGPT's entire user base within roughly forty-eight hours, a rollout the company says covers more than 1.2 billion weekly users.</p>
<h2>The rollout, day by day</h2>
<p>On <strong>October 7</strong>, GPT-6 (the Instant configuration) reached paid tiers — Plus, Pro, Business and Enterprise — in Chat. On <strong>October 8</strong>, free and Go accounts followed. Whatever one thinks of the pacing of AI releases, the distribution story is notable: a frontier-model default switch across a user base larger than most countries, complete in two days.</p>
<h2>Intelligent UI: answers that are not paragraphs</h2>
<p>The genuinely interesting piece of the announcement is not the model itself but its output format. Alongside GPT-6, OpenAI introduced what it calls the <strong>Intelligent UI</strong>: instead of answering everything as a wall of text, ChatGPT can now respond with visuals and interactive widgets — a calorie tracker you can tap, a board-game position you can manipulate, a schedule that behaves like a schedule. The company's framing is that reasoning models have gotten good enough that the bottleneck is presentation, not intelligence.</p>
<p>It launched in Chat first, with availability in ChatGPT Work and Codex promised as the rollout progressed. In practical terms, this moves assistant output one step closer to applications: the answer is no longer only prose you copy, but an object you use.</p>
<h2>The rest of October's shuffle</h2>
<p>GPT-6's arrival capped a busy stretch. GPT-6 Astra — announced in early September — reached all ChatGPT Plus users in Work and Codex during the month. And on <strong>October 26</strong>, OpenAI shipped <strong>GPT-6.1 ("Terra")</strong> into ChatGPT Work and Codex, emphasizing visual reasoning and computer-use tasks. For anyone tracking model versions the way they once tracked phone releases, the cadence is now measured in weeks.</p>
<h2>What it means for ordinary users</h2>
<p>Three practical takeaways:</p>
<ul>
<li><strong>Default quality steps up again.</strong> When a frontier model becomes the free-tier default, baseline expectations for summarization, coding help and drafting shift across the board — tools built on "AI-grade" outputs have to keep pace.</li>
<li><strong>Interactive output changes habits.</strong> Widget-style responses work best for tasks with structure: planning, tracking, comparing. For long-form reasoning, text still does the work.</li>
<li><strong>Verification discipline still applies.</strong> A more capable model with a nicer interface is not a more truthful one; for anything consequential, the source-checking habits that mattered last year matter identically now.</li>
</ul>
<h2>Sources</h2>
<ul>
<li>OpenAI — "GPT-6 for everyone" (October 7, 2026): <a href="https://openai.com/index/gpt-6-for-everyone">openai.com/index/gpt-6-for-everyone</a> (URL verified; page returned 403 to automated inspection on October 31, 2026 — details cross-checked against multiple independent search results)</li>
</ul>`,
  },
];
