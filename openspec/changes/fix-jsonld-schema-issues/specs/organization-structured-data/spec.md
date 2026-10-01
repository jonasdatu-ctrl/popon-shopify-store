# Spec Delta

## Purpose

Keeps the site's Organization JSON-LD an accurate, machine-readable description of the brand entity — including its official social profiles — so search engines and AI systems can link the storefront to the right off-site identities.

## ADDED Requirements

### Requirement: Organization JSON-LD declares official social profiles
The Organization JSON-LD rendered on the site SHALL include a `sameAs` array listing the absolute URL of every official social profile the site publicly links to from its footer or navigation.

#### Scenario: Social profiles present in footer are reflected in sameAs
- **WHEN** the Organization JSON-LD is rendered on any page where it appears
- **THEN** the `sameAs` array SHALL contain the Facebook, Instagram, YouTube, TikTok, X, and Pinterest profile URLs that the site's footer and mobile menu link to

#### Scenario: Organization JSON-LD remains otherwise unchanged
- **WHEN** the Organization JSON-LD is rendered
- **THEN** it SHALL still include the existing `name`, `logo`, and `url` fields unchanged, with `sameAs` added alongside them

### Requirement: Social profile list has a single source of truth
The set of official social profile URLs SHALL be defined in exactly one place in the theme, read by both the visible social-link UI (footer, mobile menu) and the Organization JSON-LD's `sameAs` array, so the two cannot independently drift out of sync.

#### Scenario: Adding or changing a social profile updates both surfaces
- **WHEN** a social profile URL is added, removed, or changed in the shared source
- **THEN** both the rendered social-link UI and the Organization JSON-LD `sameAs` array SHALL reflect that change without requiring a second edit elsewhere
