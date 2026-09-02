## Why

The PDP variant selector (`snippets/customcode-general-variant-selector.liquid`) resolves each option value's swatch image from a store-wide metaobject list, keyed only by the sanitized option value name (e.g. `2 Tops` → `2_Tops`). Because metaobject handles are global, any two products that happen to share an option value name resolve to the exact same metaobject entry and therefore render the same image, even when the products are unrelated. This produces visibly wrong swatch images and there is currently no way to give a colliding product its own image without renaming the option value.

## What Changes

- Add a new product-level JSON metafield (`custom.customcode_option_value_image_overrides`) that lets a specific product declare its own image for one or more option values, keyed by the exact option value name, valued as a Shopify CDN image URL string.
- Update the option-image rendering block in `customcode-general-variant-selector.liquid` to check this per-product override first; if the current option value's name is present as a key, render that image.
- If no override key matches, fall back to the existing global metaobject lookup (`metaobjects.variant_option_values_image_display`) exactly as it works today — unaffected products see no change in behavior.
- This is an exception-case override, not a replacement of the metaobject system: most products keep relying on the shared metaobject list; only products with a colliding option value name need the override populated.

## Capabilities

### New Capabilities
- `variant-option-value-images`: Defines how the PDP variant selector resolves the image shown for each option value swatch, including the per-product override and the global fallback.

### Modified Capabilities
(none — no existing spec covers this behavior today)

## Impact

- **Liquid**: `snippets/customcode-general-variant-selector.liquid` (option-image lookup block, ~lines 103-114).
- **Shopify Admin / data model**: new metafield definition, owner resource Product, namespace `custom`, key `customcode_option_value_image_overrides`, type JSON. No changes to the existing `variant_option_values_image_display` metaobject definition or its existing entries.
- **Merchandiser workflow**: editors of a colliding product upload the distinct image to Shopify Files, copy its CDN URL, and add a `"<option value name>": "<url>"` entry to that product's override metafield. No workflow change for products that don't collide.
- **No breaking changes**: existing products with no override metafield populated continue to resolve images exactly as before via the global metaobject.
