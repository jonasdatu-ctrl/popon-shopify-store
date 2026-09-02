## 1. Metafield setup

- [ ] 1.1 In Shopify Admin > Settings > Custom data > Products, create a metafield definition with namespace `custom`, key `customcode_option_value_image_overrides`, type JSON, and verify it appears on a test product's metafields editor.
- [ ] 1.2 On a test product, add a sample override value (e.g. `{ "2 Tops": "<a real CDN file URL>" }`) and verify it saves without validation errors.

## 2. Liquid lookup changes

- [x] 2.1 In `snippets/customcode-general-variant-selector.liquid`, before the existing metaobject `key`/`media` assignment (~line 104), parse `product.metafields.custom.customcode_option_value_image_overrides.value` and look up the current `value.name` as a key.
- [x] 2.2 If a matching override URL is found, render it in place of the metaobject-derived image (verify via a test product: the override image renders instead of the shared metaobject image).
- [x] 2.3 If no override metafield, no matching key, or the JSON fails to parse, fall through to the existing metaobject lookup unchanged (verify on a product with no override metafield set: swatch images render identically to current production behavior).

## 3. Verification

- [ ] 3.1 Confirm a product with no override metafield renders the same swatch images as before this change (regression check against current production for at least one multi-option product).
- [ ] 3.2 Create/find two products that share a colliding option value name (e.g. "2 Tops"), add an override to only one of them, and verify: the overridden product shows its own image, the non-overridden product still shows the shared metaobject image.
- [ ] 3.3 Verify a malformed/invalid JSON value in the override metafield does not break page rendering - swatch images fall back to the metaobject lookup for every value on that product.
