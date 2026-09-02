# variant-option-value-images Specification

## Purpose

Defines how the PDP variant selector resolves the swatch image shown for each product option value, so that products sharing an option value name (e.g. "2 Tops") do not incorrectly share the same image.

## Requirements

### Requirement: Per-product option value image override
The system SHALL allow a product to declare its own image for a specific option value via a JSON metafield (`custom.customcode_option_value_image_overrides`) keyed by the exact option value name.

#### Scenario: Product declares an override for a colliding value name
- **WHEN** a product's `custom.customcode_option_value_image_overrides` metafield contains a key that exactly matches the currently rendered option value's name
- **THEN** the swatch for that option value renders the image URL associated with that key

#### Scenario: Product has no override metafield
- **WHEN** a product's `custom.customcode_option_value_image_overrides` metafield is not set
- **THEN** the swatch image resolution falls back to the global metaobject lookup unchanged

#### Scenario: Override metafield is set but has no matching key
- **WHEN** a product's `custom.customcode_option_value_image_overrides` metafield is set but does not contain a key matching the currently rendered option value's name
- **THEN** the swatch image resolution falls back to the global metaobject lookup for that option value

### Requirement: Global metaobject remains the default resolution path
The system SHALL continue resolving swatch images from the existing `variant_option_values_image_display` metaobject list, keyed by the sanitized option value name, whenever no per-product override applies.

#### Scenario: Existing product with no override configured
- **WHEN** a product has never had `custom.customcode_option_value_image_overrides` populated
- **THEN** its option value swatches render exactly the image they rendered before this change, via the global metaobject lookup

#### Scenario: Two products share an option value name, only one has an override
- **GIVEN** Product A and Product B both have an option value named "2 Tops"
- **AND** Product A has an override entry for "2 Tops" pointing to its own image
- **AND** Product B has no override for "2 Tops"
- **WHEN** each product's swatch selector renders
- **THEN** Product A's "2 Tops" swatch shows the overridden image
- **AND** Product B's "2 Tops" swatch shows the shared global metaobject image
