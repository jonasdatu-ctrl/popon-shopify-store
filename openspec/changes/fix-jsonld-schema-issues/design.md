# Design

## Context

See proposal.md - Why. Two concrete facts shape the approach:

- The six official social URLs exist today only as literal `href` values inside `snippets/customcode-social-icon.liquid`, rendered from both the footer (`sections/footer-group.json` → `_footer-social-icons` block) and `sections/customcode-menu-drawer.liquid`.
- `sections/header.liquid` builds the Organization JSON-LD inline as a hand-written `<script type="application/ld+json">` block (lines 159-169); there is no existing abstraction for "the site's social profiles" to hook into.
- A dead, unrelated precedent (`settings.social_*_link`) exists in commented-out code in the same snippet and is still referenced by `snippets/meta-tags.liquid`'s `twitter:site` tag, but no matching settings are defined in `settings_schema.json`. This change does not revive or fix that path — it's a separate finding.

This change is also the first iteration of an ongoing "JSON-LD audit fixes" change: future findings get added here as new requirements (new or modified capabilities) and new tasks, rather than spawning a new OpenSpec change per finding.

## Goals / Non-Goals

**Goals:**
- Organization JSON-LD exposes `sameAs` with the six official profile URLs.
- The social URL list has exactly one authoritative definition in the theme.
- The approach is a plain Liquid pattern consistent with how this theme already shares small bits of data (snippet-local `assign`/arrays), not a new settings schema or app dependency.

**Non-Goals:**
- Reinstating theme-settings-driven social links (`settings.social_*_link`) — out of scope per proposal.md.
- Touching Product/Breadcrumb/ItemList JSON-LD — owned by `add-product-jsonld-and-breadcrumbs`.
- Validating or fixing any JSON-LD finding other than this one in this iteration — later findings extend this same change.

## Decisions

**Decision 1: Shared source lives in a new snippet, not a theme setting.**
Introduce a small snippet (e.g. `snippets/customcode-social-links.liquid`) that defines the six `{ name, url }` entries once, using Liquid's native array-building (`capture`/`split`, or a sequence of `assign` + array push pattern already used elsewhere in `customcode-*` snippets). Both `customcode-social-icon.liquid` (icons/footer/menu) and `header.liquid` (`sameAs`) render/include this snippet to get the list.
- *Alternative considered*: Revive `settings.social_*_link` theme settings. Rejected — bigger surface (settings_schema.json + settings_data.json + merchant-facing UI), and the proposal explicitly scopes that out as a separate, pre-existing dead-reference finding, not something to fix here.
- *Alternative considered*: Duplicate the literal 6-URL array directly in `header.liquid`. Rejected — reintroduces the exact drift risk that caused this bug (proposal.md - Why).

**Decision 2: `sameAs` is additive to the existing inline JSON-LD block.**
Keep `header.liquid`'s hand-written `<script type="application/ld+json">` block as-is structurally; add a `"sameAs": [...]` key populated from the shared snippet's data, rendered as a JSON array of plain URL strings (the common/simplest valid `sameAs` form — an array of URL strings is valid per schema.org and is what Google's structured data tooling expects).

**Decision 3: Future audit findings are added as new ADDED/MODIFIED requirement blocks in this change's specs, plus new task sections, not new changes.**
Each new "Observation/Action" finding becomes either a new requirement under `organization-structured-data` (if it concerns Organization/social schema) or a new capability spec file in this same change directory (if it concerns a different schema type entirely, e.g. a future finding about `WebSite` or `LocalBusiness` schema). The proposal's "What Changes" and "Capabilities" sections get amended accordingly when that happens.

## Risks / Trade-offs

- [Risk] A new shared snippet adds one more file to the `customcode-*` collection, increasing indirection for a future reader. → Mitigation: keep it minimal (just the data, no logic beyond defining the list) and name it clearly (`customcode-social-links`) so its relationship to `customcode-social-icon` is obvious.
- [Risk] If this change accumulates many unrelated JSON-LD findings over time, it could become a sprawling catch-all that's hard to review/ship as one unit. → Mitigation: each finding should still be independently apply-able (its own task checklist section); if the change grows unwieldy before archiving, split remaining unimplemented findings into a fresh change rather than letting it grow indefinitely.
- [Risk] `sameAs` URLs going stale again if a profile is renamed/removed without updating the shared snippet. → Mitigation: this is exactly what Decision 1's single source of truth prevents going forward; no further mitigation needed within this change's scope.

## Migration Plan

No data migration. Deploy is a theme code change (new snippet + two call sites updated); rollback is a plain revert of the same files. No merchant-facing settings change, so no backfill or re-save of theme settings is needed.
