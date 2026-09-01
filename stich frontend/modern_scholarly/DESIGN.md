---
name: Modern Scholarly
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e5'
  on-surface: '#1b1b1e'
  on-surface-variant: '#44474e'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4e5e81'
  primary: '#031635'
  on-primary: '#ffffff'
  primary-container: '#1a2b4b'
  on-primary-container: '#8293b8'
  inverse-primary: '#b6c6ef'
  secondary: '#4950c7'
  on-secondary: '#ffffff'
  secondary-container: '#7d85fe'
  on-secondary-container: '#060693'
  tertiary: '#231400'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e2700'
  on-tertiary-container: '#b08d5b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b6c6ef'
  on-primary-fixed: '#081b3a'
  on-primary-fixed-variant: '#364768'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bfc2ff'
  on-secondary-fixed: '#01006e'
  on-secondary-fixed-variant: '#2f35ae'
  tertiary-fixed: '#ffddb1'
  tertiary-fixed-dim: '#e8c08a'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#5d4217'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e5'
  surface-paper: '#f5f3f6'
  surface-ink: '#1b1b1e'
  accent-warm: '#ffddb1'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
  container-max: 1440px
---

## Brand & Style

The design system evolves the "Academic Editorial" aesthetic into a high-fidelity, creative experience that balances intellectual rigor with the visual depth of a luxury digital publication. The brand personality is authoritative yet avant-garde—think high-end architectural journals or premium research monographs. It targets a discerning audience of academics, curators, and researchers who value both substance and style.

The chosen style is **Minimalist-Editorial with a High-Contrast edge**. It utilizes a sophisticated "ink-on-paper" feel, leveraging generous whitespace and dramatic typographic shifts to guide the user's eye. Immersive image-driven layouts are supported through full-bleed containers and parallax-ready surfaces, ensuring that scholarly content is presented with the same gravity and beauty as a physical art book.

## Colors

The palette is anchored by "Deep Navy" (#1a2b4b), providing a heavy, grounded foundation that replaces standard black for a more sophisticated, "high-fidelity" feel. The primary background uses a "Soft Surface" tone (#fbf8fc) to mimic premium ivory paper stock, reducing glare and enhancing long-form reading comfort.

- **Primary:** Used for the most significant structural elements, navigation backgrounds, and high-impact headlines.
- **Secondary:** A vibrant indigo used for precise interactive moments and creative accents.
- **Tertiary:** A refined metallic gold/tan used for editorial flourishes, curated tags, and special metadata highlights.
- **Neutral:** A tiered system of off-whites and cool grays that maintain depth without introducing visual clutter.

## Typography

Typography is the core creative driver of this design system. We use **Plus Jakarta Sans** across all roles but vary the weights aggressively to create a high-contrast hierarchy. 

- **Extreme Scale:** Hero sections should utilize `display-xl` with extra-bold weights and tight tracking for a modern, high-fidelity impact.
- **Editorial Body:** Long-form content uses `body-lg` with a relaxed line-height (1.6x) to ensure the text "breathes" on the soft surface tones.
- **Micro-Copy:** Metadata and labels use `label-caps` with heavy letter-spacing and bold weights to provide a functional contrast to the fluid display type.
- **Mobile Refinement:** On smaller screens, display sizes should scale down significantly while maintaining their weight to preserve the editorial "punch."

## Layout & Spacing

The layout philosophy follows a **Modern Fluid Grid** that prioritizes white space as a first-class design element. The system uses a 12-column grid for desktop but allows for "breaking the grid" with immersive image assets that can span the full viewport width (100vw).

- **Sectioning:** Use large `section-gap` units between major content blocks to create a sense of prestige and deliberate pacing.
- **Margins:** Desktop margins are generous (64px) to frame the content like a page in a high-end book.
- **Image Integration:** Support for 50/50 splits where high-fidelity imagery occupies one half of the screen while text elegantly scrolls on the other.
- **Responsibility:** On mobile, margins tighten to 20px, and multi-column layouts stack vertically, prioritizing the legibility of the `display-lg-mobile` headlines.

## Elevation & Depth

This design system rejects heavy shadows in favor of **Tonal Layering and Tactical Blurs**. Depth is used to separate active reading environments from navigation.

- **Surface Tiers:** Use subtle shifts in color (e.g., from `surface` to `surface-paper`) to define containment.
- **The "Glass" Effect:** For high-fidelity immersion, use semi-transparent Navy overlays with a high-degree backdrop blur (20px+) for navigation bars and modal overlays.
- **Subtle Definition:** Instead of shadows, use 1px "ghost borders" in `outline-variant` colors to define card boundaries.
- **Focus States:** When an element is raised, use an ultra-diffused, low-opacity shadow tinted with the Primary Navy (#1a2b4b at 8% opacity) to keep the depth feeling organic to the palette.

## Shapes

The shape language is **Refined Geometric**. While the overall vibe is "Rounded" (0.5rem base), we use specific shape logic to denote hierarchy.

- **Primary UI Elements:** Buttons and inputs use the base 0.5rem radius.
- **Immersive Cards:** Large featured image containers should use `rounded-xl` (1.5rem) to soften the "tech" feel and make the photography feel more like a physical object.
- **Interactive Accents:** Small badges and chips use a "Soft" (0.25rem) radius to maintain a sense of precision and academic detail.

## Components

### Buttons
- **Primary:** Solid Deep Navy, white `label-caps` text. High-fidelity hover involves a subtle expansion of letter spacing or a transition to the Secondary Indigo.
- **Editorial Link:** Underlined text using a 2px offset border in the Tertiary gold color, creating a sophisticated text-based call to action.

### Cards & Imagery
- **Feature Cards:** Large-scale components with 1.5rem corners. Images should use a subtle grain overlay or high-contrast editing to match the editorial feel.
- **Captions:** Use `body-sm` in a slightly desaturated tone, placed with asymmetrical alignment relative to the image.

### Inputs & Forms
- **Modern Minimal:** Bottom-border only for a cleaner, "notarized" look, or a full 1px border with `rounded-md`. On focus, the border should darken to Primary Navy.

### Navigation
- **Top Bar:** Fixed, semi-transparent `surface` with backdrop blur. Navigation items use `label-caps` for a clean, architectural header.

### Lists
- **Data Lists:** Use horizontal rules only. Metadata should be right-aligned in `label-caps` to contrast against the left-aligned `title-sm` list items.