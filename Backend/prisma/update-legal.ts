import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Populates the legal pages with full policy text. Preserves the operator's
 * existing About and Contact entries; replaces the five template policies.
 * Rerunning is safe (same content upserted).
 */
const prisma = new PrismaClient();

const privacyPolicy = `The Daily Edit ("we", "us") is an independent digital publication. This policy explains what information we collect, why, and what happens to it. The short version: we collect as little as possible, we never sell anything, and the heavy lifting of this site happens in your browser, not on our servers.

WHAT WE COLLECT

1. Contact messages. If you use the contact form, we receive the name, email address and message you submit. This is used solely to respond to you.

2. Newsletter subscriptions. If you subscribe, we store your email address. We use a double opt-in: you must confirm via the emailed link before you receive anything. Every issue contains a one-click unsubscribe link, and unsubscribing takes effect immediately.

3. Comments. If you post a comment, we store the name and comment you submit (shown publicly) and your email address (kept privately, never displayed, used only for moderation follow-up if necessary).

4. Aggregate page views. We count article views and tool usage on our own servers, without accounts, without tracking cookies and without personal identifiers. A one-way hash of request metadata deduplicates repeat visits within a short window; the raw data cannot be reversed into a person.

5. Administrative accounts. Staff signing into the admin area authenticate with a session cookie (HTTP-only, SameSite). This cookie is strictly functional — it exists so the dashboard stays signed in, and it is not used for tracking.

WHAT WE DO NOT DO

We do not sell, rent or trade personal information. We do not run advertising or third-party tracking cookies while advertising is unconfigured. If Google AdSense is enabled in the future, Google may set advertising cookies subject to the consent notice shown at that time — this policy will be updated before that happens.

THIRD PARTIES

The site loads web fonts from Google Fonts and may embed public images from Wikimedia Commons under their respective licenses. These services receive standard technical request data (such as your IP address) as part of serving content. We keep no server logs beyond what is operationally necessary.

DATA RETENTION AND YOUR RIGHTS

Contact messages are kept until resolved, then deleted on request. Newsletter data is deleted immediately on unsubscribe. Comments remain until you ask us to remove them. To access, correct or delete anything you have submitted, use the contact form — we respond within a few business days.

CHANGES TO THIS POLICY

If this policy changes materially, the updated version will be posted on this page with a revised review date.`;

const terms = `These terms govern your use of The Daily Edit website and its tools. By using the site, you accept them.

THE CONTENT

Articles, guides and opinions on this site are provided for general information. You may read, link to and quote them with attribution. You may not republish full articles wholesale without permission. All editorial content remains the property of its authors.

THE TOOLS

The tools on this site run in your browser and process your files locally on your device. They are offered free of charge, as-is, without any warranty of fitness for a particular purpose. While we build them carefully, you remain responsible for keeping backups of anything important before processing it — no service, local or remote, is a substitute for backups.

YOUR CONTRIBUTIONS

Comments you post must be lawful, respectful and your own words. We moderate comments and may remove or refuse anything spammy, abusive, unlawful or off-topic. By posting a comment you confirm you have the right to its contents. Newsletter signups must use an email address you control.

ACCEPTABLE USE

You agree not to: attempt to breach or probe the site's security or admin area; submit automated or fraudulent traffic; scrape the site in a way that degrades it for others; or misrepresent the site's content as your own or as endorsed by us.

THIRD-PARTY LINKS

Articles may link to external sources for verification and further reading. We choose sources carefully but do not control them and are not responsible for their content or availability.

LIMITATION OF LIABILITY

The site and its tools are provided "as is" and "as available". To the maximum extent permitted by applicable law, we are not liable for indirect or consequential damages arising from your use of the site, including data loss from processed files. Nothing in these terms limits liability that cannot be limited under applicable law.

CHANGES

We may update these terms as the site evolves. Material changes will be reflected on this page. Continued use after changes are posted constitutes acceptance.`;

const disclaimer = `The information published on The Daily Edit is for general informational and educational purposes only.

NOT PROFESSIONAL ADVICE

Nothing on this site constitutes professional, legal, financial, medical or security consulting. Technology guides and security explainers describe general practices; your situation may differ, and critical decisions should be verified against official documentation or a qualified professional.

ACCURACY AND TIMELINESS

We research and fact-check carefully — every article cites its sources — but software changes fast, and a guide that was correct when written can be overtaken by an update. We date our articles and correct errors when found (see our Editorial Policy), but we do not promise that every page reflects the latest state of every tool.

TECHNICAL GUIDANCE

Step-by-step instructions are provided in good faith and tested where stated. Systems differ: settings, file paths and behavior can vary by version and platform. Verify critical steps — especially anything involving security configuration, data deletion or system changes — before acting.

TOOLS

The browser-based tools process files locally on your device and are provided as-is. Results depend on your input files and browser capabilities. As stated in our Terms, keep backups before processing anything important.

EXTERNAL LINKS

We link to primary sources and further reading. We inspect what we link to, but we do not control external sites and their content may change after publication.

CONTACT

If you spot an error, use the contact form — corrections are important to us and are handled under our Editorial Policy.`;

const editorialPolicy = `This page explains how content on The Daily Edit is made, checked and corrected.

ORIGINAL WORK

Every article is written originally for this publication, based on research into primary sources — official announcements, documentation, advisories and statements. We do not rewrite other publications' work, and we do not publish unverified claims. Where an article draws on reporting, it says so and cites the source.

SOURCING

Claims that depend on facts are cited. Each article ends with a Sources section listing the exact documents used, with their original publication dates and the date we accessed them. When a primary source could not be directly inspected, the article says so explicitly rather than implying otherwise.

AI DISCLOSURE

We use software tooling, including machine-assisted research and drafting assistance, during production. Every article is then reviewed, verified and approved by a human editor before publication, and nothing is published automatically. We do not publish machine-written content unreviewed, and we do not use generated imagery to depict real events.

CORRECTIONS

Errors are fixed and acknowledged. If we get something materially wrong, we correct the article and note the correction. To report an error, use the contact form — corrections are treated as a priority, not a nuisance.

INDEPENDENCE AND ADVERTISING

Editorial decisions are made independently of any commercial consideration. If advertising is enabled on the site, ad placements are labeled as such and kept visually and structurally separate from editorial content. We do not publish paid articles disguised as editorials, and affiliate or sponsored content — if ever introduced — will be labeled unambiguously.

COMMENT MODERATION

Comments are reviewed before appearing. We approve good-faith discussion and criticism; we remove spam, abuse and anything unlawful. Moderation decisions are content decisions, not censorship of ideas we dislike.

REVIEW

This policy was last reviewed by the editorial desk on October 31, 2026.`;

const cookiePolicy = `This page explains how cookies and similar technologies are used on The Daily Edit.

THE SHORT VERSION

This site is deliberately light on cookies. The only cookie we set ourselves is a strictly functional one for the admin area. Public readers browse the site without any tracking cookies, and our analytics do not use cookies at all.

COOKIES WE SET

Admin session cookie (tde_session). Set only when a staff member signs into the admin area. It is HTTP-only (not readable by scripts), SameSite, and expires when the session ends. It is functional — without it the dashboard cannot stay signed in — and it is never used for tracking or advertising.

WHAT WE DO WITHOUT COOKIES

Aggregate article views and tool usage are counted on our own servers using a one-way hash of request metadata for deduplication. No cookie is placed in your browser for this, nothing cross-site is collected, and the data cannot be linked back to you as a person.

THIRD-PARTY COOKIES

Currently none. While advertising is unconfigured, no third-party scripts or cookies run on this site. If Google AdSense is enabled in the future, Google may set advertising and measurement cookies; that will be disclosed here and subject to the consent notice shown at the time.

FONTS AND EMBEDS

Web fonts are loaded from Google Fonts, which receives your IP address as part of serving the files. Embedded images from Wikimedia Commons are served from their CDN under their respective policies.

CONTROLLING COOKIES

You can clear or block cookies in your browser settings at any time. Blocking the admin session cookie simply means signing in again on each visit. Since the public site sets no tracking cookies, blocking cookies does not degrade your reading experience.

CHANGES

If our cookie usage changes, this page will be updated to describe it before the change takes effect.`;

async function main() {
  const existing = await prisma.siteSetting.findUnique({ where: { key: 'legal' } });
  const current = (existing?.value ?? {}) as Record<string, string>;

  const legal = {
    ...current, // preserves the operator's About and Contact text
    privacyPolicy,
    terms,
    disclaimer,
    editorialPolicy,
    cookiePolicy,
  };

  await prisma.siteSetting.upsert({
    where: { key: 'legal' },
    update: { value: legal as never },
    create: { key: 'legal', value: legal as never },
  });

  console.log('✓ Legal pages populated: privacyPolicy, terms, disclaimer, editorialPolicy, cookiePolicy (About/Contact preserved).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
