import type { SeedArticle } from './types.js';

/** Evergreen educational content, part two. */
export const evergreenB: SeedArticle[] = [
  {
    title: 'The Weekly Review: the 30-Minute Habit That Keeps Every Other System Honest',
    subtitle: 'Task lists do not fail because you picked the wrong app. They fail because nothing ever looks at them. Here is a weekly review that actually survives busy weeks.',
    category: 'Productivity',
    tags: ['productivity', 'workflow', 'habits'],
    seoDescription: 'A practical weekly review ritual: how to process inboxes, prune stale tasks, and plan the coming week in 30 minutes — plus why skipping it breaks every other system.',
    content: `<p>Ask someone why their task management is not working and you will usually hear about tools. But almost every failed system fails the same way: it was set up with enthusiasm, used faithfully for two weeks, and then silently abandoned — because the one habit that maintains it was never installed. That habit is the weekly review.</p>
<h2>Why systems rot without a review</h2>
<p>A to-do list is a model of your commitments. Reality changes daily — projects shift, deadlines move, tasks you wrote in September stop mattering — but the list does not update itself. Without a scheduled moment to reconcile the two, the list drifts out of truth. And a list you do not trust is a list you stop reading, which is why the abandonment feels sudden even though the drift was gradual.</p>
<p>The weekly review is the reconciliation. Done consistently, it is what makes every other productivity habit cheap: capturing tasks takes seconds when you know a review is coming; deciding what to do each morning takes minutes when the week has already been thought through.</p>
<h2>The review, in five steps</h2>
<h3>1. Empty the inboxes (10 minutes)</h3>
<p>Gather everything into one place — email flagged for action, messages to yourself, notes app scraps, paper. For each item, decide: do it now if it takes under two minutes, put it on the task list with a concrete next verb, or delete it. Do not organize yet; just get everything visible.</p>
<h3>2. Prune the task list (5 minutes)</h3>
<p>Scan every open task and kill without mercy. Delete the ones that no longer matter — stale intentions are noise that makes real tasks harder to see. Rewrite vague tasks into actions: "website stuff" is not a task, "email Dana the three hosting quotes" is. If something has been deferred three times, that is a signal to either schedule it concretely or admit it is a maybe and move it to a someday list.</p>
<h3>3. Look backward (5 minutes)</h3>
<p>Skim your calendar and sent mail for the past week. You are hunting for dropped threads: the meeting that generated a task you never wrote down, the person awaiting a reply. This step catches more forgotten commitments than any app.</p>
<h3>4. Look forward (5 minutes)</h3>
<p>Walk the next two weeks of your calendar. What needs preparation — materials for Thursday's review, the trip at the end of the month, the renewal that lands during a holiday? Turn each into a task with a date <em>before</em> the event, not on it.</p>
<h3>5. Choose the week's big three (5 minutes)</h3>
<p>Pick the three outcomes that would make the week a success even if nothing else got done. Write them at the top of the week's plan. This is the step that turns the review from bookkeeping into direction-setting.</p>
<h2>Making it survive</h2>
<p>The review fails the same way gym plans fail: it loses to the urgent. Three defenses work. <strong>Anchor it</strong> — Friday afternoon or Sunday evening, same slot every week, calendar-blocked. <strong>Shrink it</strong> — a ten-minute version done every week beats a perfect hour done twice. <strong>Lower the stakes</strong> — the review is maintenance, not judgment; a messy week just means more pruning.</p>
<p>Thirty minutes a week is roughly two hours a month — and it is the difference between a system you trust and a system you abandon by November.</p>`,
  },
  {
    title: 'Reading Stack Traces Like an Engineer (Not Like Someone Panicking)',
    subtitle: 'A stack trace is a witness statement, not an accusation. A practical method for extracting the real bug from the wall of red text.',
    category: 'Programming',
    tags: ['debugging', 'beginners', 'engineering'],
    seoDescription: 'How to read a stack trace: start from your own code, trace the call chain bottom-up or top-down, read the error message grammar, and reproduce before you fix.',
    content: `<p>Few things intimidate people learning to code like a stack trace — dozens of lines, file paths, line numbers, internal library frames, and a wall of red. But a stack trace is not an accusation; it is a witness statement. It tells you, with unusual honesty, exactly where the program was and what it was doing when things went wrong. Learning to read it is the single highest-leverage debugging skill.</p>
<h2>Start with the error line, but do not end there</h2>
<p>The first line of most traces is the exception: a type and a message, like <code>TypeError: Cannot read properties of undefined (reading 'name')</code>. Read it as a sentence. This one says: "something was <code>undefined</code>, and the code tried to read its <code>.name</code> property." That grammar — <em>could not [verb] [thing] (while reading/writing [property])</em> — already narrows the bug enormously. You are not looking for "an error"; you are looking for the expression that dereferences a possibly-missing object.</p>
<h2>Then read the trace from your own code outward</h2>
<p>The frames below the error line are the call chain — what was running when the exception fired. Two rules make them manageable:</p>
<ul>
<li><strong>Top frame first, but your code before libraries.</strong> The topmost frame is where it exploded, but the bug is usually in a frame you wrote. In a long trace, scan for the first file path that belongs to your project — that is almost always where your understanding should start.</li>
<li><strong>Read the chain as a story.</strong> Frame order tells you how the program got there: <code>handleSubmit → saveOrder → calculateTotals → boom</code>. The bug may be in <code>calculateTotals</code>, but the <em>cause</em> is often further up — the bad input <code>saveOrder</code> passed in. Ask at each hop: what did this caller contribute?</li>
</ul>
<p>Also learn your runtime's conventions. JavaScript traces read top-down (error first); Java and Python also list the most recent call first, but Python prints the call chain "outside-in" above the exception. Either way, the rule holds: <strong>find your frames, follow the story toward the input.</strong></p>
<h2>Frames that are not noise</h2>
<p>Library and framework frames feel like noise, but they carry two useful signals. A repeated async/framework pattern at the bottom tells you where the entry point was. And a frame with a <em>line number inside a minified bundle</em> is a reminder that you are debugging production artifacts — reproduce locally with source maps before concluding anything about that frame.</p>
<h2>The message is often about the type, the bug is about the value</h2>
<p>"Cannot read properties of undefined" tells you the <em>mechanism</em>. The actual bug is usually one level earlier: a function returned <code>undefined</code> because a lookup missed, an optional field was never set, an <code>await</code> was forgotten. So after reading the trace, the question to answer is not "why is this line broken?" but <strong>"why was this value what it was?"</strong> — which sends you to the caller with a specific question instead of a vague one.</p>
<h2>Reproduce before you fix</h2>
<p>The last discipline separates engineers from guessers: rebuild the failure deliberately. Same input, same environment, same exception — ideally as a test. If you cannot reproduce it, you are not fixing the bug; you are fixing <em>a</em> bug, possibly one nobody had. A trace plus a reproduction is a closed loop: the trace tells you where to look, the reproduction tells you whether you have actually understood what you found.</p>
<h2>A checklist for the next wall of red</h2>
<ol>
<li>Read the exception type and message as a sentence.</li>
<li>Find the first frame that is your code.</li>
<li>Walk up the call chain asking what each caller contributed.</li>
<li>Ask why the value was what it was — one level earlier.</li>
<li>Reproduce it on demand, ideally as a failing test, before calling it fixed.</li>
</ol>
<p>Stack traces are the most honest documentation your program will ever produce. Read them like a colleague's incident report — carefully, from your own lines outward — and the panic fades surprisingly fast.</p>`,
  },
];
