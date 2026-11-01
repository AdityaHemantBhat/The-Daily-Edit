import type { SeedArticle } from './types.js';

/** Evergreen technology and AI explainers — batch 5. */
export const evergreenF: SeedArticle[] = [
  {
    title: 'How SSDs Work — and Why They Sometimes Just Vanish',
    subtitle: 'No moving parts, absurd speeds, and a failure mode unlike any hard drive. What flash storage actually does with your bits, and how to keep an SSD alive longer.',
    category: 'Technology',
    tags: ['hardware', 'storage', 'explained'],
    seoDescription: 'How SSDs store data in NAND flash cells, why they wear out differently from hard drives, TRIM, and the practical habits that keep a solid-state drive healthy.',
    content: `<p>A hard drive stores bits as magnetism on spinning platters. A solid-state drive stores them as <strong>electric charge trapped in microscopic cells</strong> — no movement at all. That single difference explains everything about SSDs: the speed, the silence, the shock resistance, and their strange failure modes.</p>
<h2>How the bits live in the cells</h2>
<p>An SSD's NAND flash cells are like tiny buckets holding electrons. A single-level cell (SLC) stores one bit — charged or not. Consumer drives use multi-level cells (MLC/TLC/QLC) that store 2–4 bits per cell by measuring how much charge is in the bucket — more bits per cell means cheaper storage, but finer measurements that wear faster and read slower.</p>
<p>Writing is the strange part: flash cells can only be erased in large <strong>blocks</strong>, not individually. Updating one byte means reading a whole block, erasing it, and rewriting it — which is why SSDs contain a translator layer (the controller's "flash translation table") that juggles where data actually lives, spreading writes across the drive. This layer is why an SSD can be mysteriously full when it isn't, and why a freshly erased drive performs differently from a long-used one.</p>
<h2>Wear: the write-budget problem</h2>
<p>Every erase cycle physically degrades a cell's insulating layer — after enough cycles, charge leaks and the cell becomes unreliable. Each cell tolerates a few thousand program-erase cycles (TLC ~1,000–3,000; QLC fewer). The controller combats this with <strong>wear leveling</strong> — spreading writes so no cell dies early — and over-provisioning spare capacity. For a normal user, the arithmetic is reassuring: a typical TLC drive can absorb decades of daily use before cells exhaust. Monitoring tools expose "TBW" (terabytes written) and remaining life percentage if you want the gauge.</p>
<h2>TRIM: telling the drive what it may forget</h2>
<p>When you delete a file, the OS doesn't immediately tell the SSD — the space is just "logically free." The <strong>TRIM</strong> command passes that hint along so the controller can erase those blocks in the background and keep performance crisp. Modern operating systems issue TRIM automatically; it's why a healthy SSD doesn't slow down like an old one.</p>
<h2>The failure mode that surprises people</h2>
<p>Hard drives usually warn you — clicking, slow reads, bad sectors accumulating. SSDs often fail <strong>suddenly</strong>: the controller or power circuitry dies with no warning, or a worn cell loses data while powered off (retention degrades with age and heat). The consequence for your habits is unambiguous: <strong>backups matter more on SSDs</strong>, not less. The 3-2-1 rule — three copies, two media, one offsite — applies to silent failure modes doubly.</p>
<h2>Keeping one healthy</h2>
<ul>
<li>Leave 10–20% of the drive empty — the controller needs working room for wear leveling.</li>
<li>Keep firmware updated (vendor tools handle it).</li>
<li>Don't run classic defragmentation on it — the OS knows better; scheduled "optimization" in Windows sends TRIM instead.</li>
<li>Avoid heat where possible; cells age faster hot.</li>
</ul>`,
  },
  {
    title: 'Cores, Threads and Clock Speeds: What Actually Makes a Computer Fast',
    subtitle: 'Marketing sells gigahertz and core counts. What actually determines whether a laptop feels fast depends on what you do with it.',
    category: 'Technology',
    tags: ['hardware', 'cpus', 'explained'],
    seoDescription: 'CPU cores, threads and clock speed explained: what each does, when more cores matter, why clock speed alone is misleading, and what makes a computer feel fast for your work.',
    content: `<p>Computer shopping drowns you in numbers: 12 cores, 24 threads, 5.4 GHz. Which matters? The honest answer is "depends what you run" — but the dependencies follow simple rules once you know what a core actually is.</p>
<h2>The core is a worker; the clock is its pace</h2>
<p>A <strong>core</strong> is an independent processor — one worker who executes instructions. <strong>Clock speed</strong> (gigahertz) is how many instruction cycles each worker completes per second. Two CPUs with different designs can't be compared by clock alone — a modern 3 GHz core does far more per cycle than one from 2015 — but within the same generation, higher clock means faster single-task performance.</p>
<p><strong>Threads</strong> are a bonus: most modern cores can run two instruction streams at once (simultaneous multithreading), feeding the core's idle parts while one stream waits on memory. That's why a "12 cores / 24 threads" CPU is one worker per core with two desks each.</p>
<h2>When cores matter — and when they don't</h2>
<ul>
<li><strong>Tasks that split cleanly scale with cores:</strong> video encoding, 3D rendering, compiling large codebases, scientific batch jobs. Sixteen cores genuinely beat four — often several times faster.</li>
<li><strong>Tasks that don't split:</strong> most everyday apps are <strong>single-threaded at any instant</strong> — the web page you're waiting on, the spreadsheet recalculation, the app launch. They care about clock speed and per-core design, not core count. A 16-core CPU with slow cores feels <em>slower</em> than a 4-fast-core chip for these.</li>
</ul>
<p>Modern laptop CPUs handle this with mixed cores: fast "performance" cores for the foreground task, efficient cores for the background crowd. The scheduler assigns the work; the marketing assigns the confusion.</p>
<h2>The other bottlenecks people forget</h2>
<p>A fast CPU waiting on slow storage or RAM feels slow — the processor spends its life idle, waiting for data. An SSD (versus a hard drive) improves "computer feels fast" more than any CPU upgrade in most cases, because booting, opening files and launching apps are storage-bound. RAM capacity matters next: when memory runs out, the system swaps to disk and everything crawls. CPU is usually the <em>third</em> thing to blame.</p>
<h2>Practical buying rules</h2>
<ul>
<li><strong>Everyday use (browsing, office, media):</strong> any modern 4–8 core CPU; spend the budget on the SSD and RAM.</li>
<li><strong>Development and heavy multitasking:</strong> 8+ performance-oriented cores and 32 GB RAM.</li>
<li><strong>Video, rendering, simulation:</strong> the highest core count you can afford — these workloads actually feed every worker.</li>
<li><strong>Gaming:</strong> per-core speed and the graphics card dominate; beyond 8 cores, returns diminish sharply.</li>
</ul>
<p>And one free upgrade beats all of them: closing the forty background tabs that are quietly spending your cores on things you weren't looking at.</p>`,
  },
  {
    title: 'OLED vs LCD: Every Screen Difference That Actually Matters',
    subtitle: 'Perfect blacks versus brightness, burn-in versus longevity, response times and battery life — an honest comparison of the two display technologies.',
    category: 'Technology',
    tags: ['displays', 'hardware', 'technology'],
    seoDescription: 'OLED vs LCD explained: how each technology produces images, the real differences in contrast, brightness, burn-in risk, battery life and which suits your use.',
    content: `<p>Every screen you own uses one of two families. <strong>LCD</strong> produces images with a constant backlight shining through liquid-crystal shutters. <strong>OLED</strong> makes every pixel produce its own light — and switch it off completely. That single architectural difference drives every practical difference between them.</p>
<h2>Contrast and black levels: OLED's knockout</h2>
<p>An LCD's backlight is always on; its "black" is the shutter blocking as much light as it can — dark gray in a dark room, plus glow bleeding from the edges. An OLED pixel showing black emits <strong>nothing</strong>: true black, infinite contrast, and detail visible in shadows that an LCD crushes away. Watching space scenes or reading dark-mode interfaces is a categorically different experience.</p>
<h2>Brightness: LCD's counterpunch</h2>
<p>An OLED pixel burning at maximum ages faster, so OLEDs cap sustained full-screen brightness well below what a good LCD manages — and they dim automatically to protect themselves when a bright static image lingers (automatic brightness limiting). LCDs, with a separate durable backlight, sustain very high brightness indefinitely, which matters for sunlit rooms and for HDR highlights on large screens.</p>
<h2>Burn-in: the OLED tax</h2>
<p>Because OLED pixels wear with use, static elements — taskbars, channel logos, HUD lines in games — can leave faint permanent ghosts after long, repeated display at high brightness. Modern OLEDs counter with pixel shifting, logo dimming and refresh cycles, and mixed-content use rarely shows trouble within a normal ownership period. But a television used eight hours a day on a news channel with a persistent banner, or a monitor permanently showing a trading dashboard, is the documented risk case. LCDs don't burn in.</p>
<h2>Speed and size</h2>
<p>OLED pixels change state near-instantly — response times are effectively zero, eliminating the motion blur LCDs show on fast content. OLED also allows pixel-perfect dimming zones and, in TVs, becomes practical at thinner designs and larger sizes. LCDs fight back with mini-LED backlights that create hundreds of dimming zones — dramatically improving their contrast while keeping LCD brightness and longevity.</p>
<h2>Which to choose</h2>
<ul>
<li><strong>Movies, gaming, dark-room use, image quality obsessives:</strong> OLED — the contrast is not a subtle difference.</li>
<li><strong>Bright rooms, static-content workdays (dashboards, documents), long-ownership budgets:</strong> a good LCD/mini-LED — brightness and burn-in immunity are worth more than perfect blacks.</li>
<li><strong>Phones:</strong> OLED dominates because per-pixel light saves battery on dark interfaces — black pixels cost nothing.</li>
</ul>
<p>The technologies are converging from both directions — LCDs gaining per-pixel control, OLEDs gaining brightness — but the architectural trade (perfect pixels versus durable brightness) remains the decision you're actually making.</p>`,
  },
  {
    title: 'What Fine-Tuning Actually Means (and When You Need It)',
    subtitle: 'Fine-tuning is not how you teach a model facts. It\u2019s how you teach it a behavior. The distinction that saves companies six figures.',
    category: 'Artificial Intelligence',
    tags: ['ai', 'explained', 'llm'],
    seoDescription: 'Fine-tuning explained: what it changes in a model, what it does not, when RAG or prompt engineering is the better tool, and the cases where fine-tuning earns its cost.',
    content: `<p>Every organization that touches AI eventually has the same meeting: "We should fine-tune a model on our data." Sometimes that's right. Often it's the most expensive way to solve the wrong problem. Understanding what fine-tuning actually changes is the difference.</p>
<h2>What fine-tuning changes: behavior, not knowledge</h2>
<p>A base model already learned language and world knowledge from vast training data. Fine-tuning takes that model and continues training it — on hundreds to thousands of curated examples — to adjust <strong>how it responds</strong>: its style, format, tone, and the patterns it follows. Fine-tuned on your support tickets, a model learns to answer in your support voice, with your structure, making your common judgment calls. It does <strong>not</strong> reliably learn your facts: knowledge baked in via fine-tuning is thin, hard to update, and prone to confident errors. Facts belong in a retrieval system, not in the weights.</p>
<h2>The decision tree</h2>
<ol>
<li><strong>Does the model need to know things it doesn't know?</strong> (Your documents, prices, policies.) Use <strong>retrieval (RAG)</strong>: give the model your documents at question time. Cheap, updatable, auditable — the facts stay in a database, not in fuzzy weights.</li>
<li><strong>Is the model's output format, tone or judgment wrong for your use?</strong> If prompting with good examples almost gets there, <strong>prompt engineering</strong> is the free version of fine-tuning. Try that first, seriously.</li>
<li><strong>Have you exhausted prompting, need the behavior at scale, and have hundreds of excellent examples?</strong> Now fine-tuning earns its cost: consistent structure, a specific voice, latency savings (fine-tuned smaller models can replace prompted larger ones), and behavior that doesn't depend on a thousand-token prompt being repeated perfectly.</li>
</ol>
<h2>What good fine-tuning data looks like</h2>
<p>Quality over quantity, brutally. Five hundred examples that are exactly right beat fifty thousand that are roughly right — the model reproduces your data's flaws as faithfully as its virtues. Examples should cover the real distribution of inputs, including edge cases and refusals ("here's how to respond when the answer isn't in the policy"). And hold out a test set before you start; you cannot measure improvement without one.</p>
<h2>The honest costs</h2>
<p>Beyond training compute: curation labor (the real cost), a deployment to maintain, and a new risk — a fine-tuned model inherits your examples' biases and blind spots, and updating its knowledge means retraining. RAG updates by editing a document. Choose accordingly: <strong>behavior in the weights, knowledge in the database.</strong></p>`,
  },
  {
    title: 'Why AI Models Hallucinate — and Why No One Has Fully Fixed It',
    subtitle: 'A language model generates plausible text; sometimes the plausible text is false with total confidence. The mechanism behind hallucination, and what actually reduces it.',
    category: 'Artificial Intelligence',
    tags: ['ai', 'explained', 'llm'],
    seoDescription: 'Why AI models hallucinate: language models generate plausible text, not verified truth — the mechanism behind confident false answers, and the mitigations that actually help.',
    content: `<p>An AI model cites a legal case that doesn't exist, with volume number and page. It names a book as an author's most famous work when they never wrote it. It does this in fluent, confident prose. This is "hallucination" — and understanding why it happens requires accepting an uncomfortable framing: the model isn't lying. It's doing exactly what it was built to do.</p>
<h2>The mechanism: plausible, not true</h2>
<p>A language model is trained on one objective: given text, produce the most plausible continuation. Every capability — writing code, summarizing contracts, translating — is an application of that same next-token machinery. The machinery has no fact-checker attached. When the plausible continuation happens to be true, the model looks brilliant. When the training data was thin on a topic, or the question pushes into territory where plausible and true diverge, the model generates something fluent, confident — and false. It cannot feel the difference, because plausibility is the only signal it has ever optimized.</p>
<h2>Why it can't simply look things up</h2>
<p>Models store knowledge as statistical patterns across their parameters, not as retrievable records. Asking "what year did X happen?" doesn't query a database of facts; it samples from compressed patterns of how the internet talked about X. Compression loss and pattern-blending are the raw material of hallucination. And a model asked a question with no good answer in its training still must produce <em>something</em> — the path of least resistance is a plausible fabrication, delivered in the same confident tone as an accurate answer.</p>
<h2>What actually reduces it</h2>
<ul>
<li><strong>Retrieval augmentation (RAG):</strong> give the model the relevant documents at question time and instruct it to answer from them. The model's fluency becomes a search-and-summarize interface over verifiable text. This is the single most effective architectural fix — and why serious deployments pair models with retrieval.</li>
<li><strong>Tool use:</strong> models that can call a search engine, a calculator or a code interpreter outsource their weakest function (recall) to systems built for it.</li>
<li><strong>Training against hallucination:</strong> newer models are fine-tuned to say "I don't know" more often and to prefer grounded answers. It reduces — historically by meaningful margins — but does not eliminate, because the base objective remains plausibility.</li>
<li><strong>Your prompts:</strong> asking for sources, constraining to provided documents, and treating confident specificity as a flag to verify rather than a signal of truth.</li>
</ul>
<h2>The design principle for using AI well</h2>
<p>Treat the model as a brilliant, tireless, slightly unreliable assistant: superb at structure, drafting, transformation and brainstorming; requiring verification for facts, citations, numbers and anything with consequences. The hallucination isn't a bug that a future update necessarily deletes — it's a property of a machine that predicts plausibility. The fix isn't in the model alone; it's in the workflow around it.</p>`,
  },
];
