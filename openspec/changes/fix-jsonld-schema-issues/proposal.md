# Proposal

## Why

A structured-data audit of the site's JSON-LD is turning up discrete correctness problems outside the scope of the in-flight `add-product-jsonld-and-breadcrumbs` change (which covers Product/Breadcrumb/ItemList schema only and explicitly treats the existing Organization schema as unaffected). This change is a home for those audit findings, captured and fixed one at a time as they're identified, starting with the first: the sitewide Organization JSON-LD omits `sameAs`, so Google and AI systems have no machine-readable link between the brand entity and its official social profiles, even though the footer and mobile menu already list six of them.

## What Changes

- Add a `sameAs` array to the Organization JSON-LD in `sections/header.liquid`, listing the official Facebook, Instagram, YouTube, TikTok, X, and Pinterest profile URLs.
- Extract those six URLs (currently hardcoded only inside `snippets/customcode-social-icon.liquid`) into one shared source that both the existing social-icon rendering (footer, `sections/customcode-menu-drawer.liquid`) and the new `sameAs` array read from, so the visible links and the structured data cannot drift apart again.
- Establish this change as the running home for future JSON-LD audit findings (added as new requirements/tasks in later iterations, not new changes per finding).

**Explicitly out of scope for this iteration:**
- Product, BreadcrumbList, and ItemList JSON-LD — owned by `add-product-jsonld-and-breadcrumbs`.
- Re-introducing theme-settings-driven social links (`settings.social_*_link`) — the dead reference in `snippets/meta-tags.liquid` is a related but separate finding; not addressed here unless raised as its own audit item.
- Any other JSON-LD findings not yet identified — to be added to this change's specs/tasks as they come in.

## Capabilities

### New Capabilities
- `organization-structured-data`: Organization JSON-LD on the site (name, logo, url, and `sameAs` social profile links) stays accurate and sourced from a single place, rather than drifting from the visible footer/menu social links.

### Modified Capabilities
- None yet — future audit findings may add to `organization-structured-data` or introduce further new capabilities as they're captured.

## Impact

- **Affected sections**: `sections/header.liquid` (Organization JSON-LD gains `sameAs`).
- **Affected snippets**: `snippets/customcode-social-icon.liquid` (and anywhere else the social URL list is duplicated, e.g. `sections/customcode-menu-drawer.liquid`) refactored to read from one shared source instead of inline hardcoded URLs.
- **No visible UI changes** — the footer/menu social icons render the same links as today; this is additive/corrective structured data plus an internal de-duplication of the URL list.
- **Dependencies**: none — no new apps or external libraries.
