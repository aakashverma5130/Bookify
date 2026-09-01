---
name: Academic Editorial
colors:
  surface: '#fdf9e9'
  surface-dim: '#dedacb'
  surface-bright: '#fdf9e9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f4e4'
  surface-container: '#f2eede'
  surface-container-high: '#ece8d9'
  surface-container-highest: '#e6e3d3'
  on-surface: '#1c1c13'
  on-surface-variant: '#514538'
  inverse-surface: '#323126'
  inverse-on-surface: '#f5f1e1'
  outline: '#837566'
  outline-variant: '#D8C3AD'
  surface-tint: '#855300'
  primary: '#653e00'
  on-primary: '#ffffff'
  primary-container: '#855300'
  on-primary-container: '#ffd09a'
  inverse-primary: '#fdb965'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#474647'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f5e5e'
  on-tertiary-container: '#dbd8d7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#fdb965'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1c1b1c'
  on-tertiary-fixed-variant: '#474647'
  background: '#fdf9e9'
  on-background: '#1C1C13'
  surface-variant: '#e6e3d3'
  surface-base: '#FFFBEB'
  accent-warm: '#F59E0B'
  accent-deep: '#D97706'
  ink-primary: '#1B1B1B'
  ink-secondary: '#474747'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  content-max-width: 1280px
---

## Brand & Style

Academic Editorial is a design system crafted for institutional environments that value focus, clarity, and intellectual rigor. It targets students and academics who require a workspace that feels modern yet grounded in tradition.

The visual style is **Corporate / Modern** with a strong **Editorial** influence. It utilizes a warm, parchment-inspired palette to evoke the feeling of high-quality paper, while maintaining a clean, systematic structure. The interface emphasizes high-quality typography and generous whitespace to reduce cognitive load, creating a calm, premium atmosphere that mimics a well-organized physical library.

## Colors

The color palette is built on a foundation of warm neutrals and "literary" earth tones. 

- **Primary Foundation:** A deep, scholarly amber-brown (#855300) serves as the anchor for interactive elements and brand presence.
- **Accent Layer:** A vibrant "Warm Accent" (#F59E0B) is used for primary calls to action, providing a modern spark against the more traditional base.
- **Surface Strategy:** The background uses "Parchment" (#FFFBEB) rather than pure white to soften eye strain during long reading sessions.
- **Ink Tones:** Typography avoids pure black, opting for "Ink Primary" (#1B1B1B) to maintain a soft, high-end editorial feel.

The system is designed to transition into a "Dark Mode" where surfaces become deep charcoals while maintaining the warm amber accents.

## Typography

The typography system relies on **Plus Jakarta Sans**, a modern geometric sans-serif that balances approachability with professional precision. 

- **Display & Headlines:** Use tight letter-spacing and heavy weights (Bold/700) to create a commanding presence. 
- **Body Text:** Optimized for legibility with a generous line-height (1.6x) to facilitate scanning of long technical descriptions.
- **Functional Labels:** Utilizes an uppercase "Label Caps" style with increased letter-spacing to distinguish metadata and navigation from content.
- **Numeric Data:** A fallback monospaced font is reserved for data-heavy displays or archive numbering.

## Layout & Spacing

The system uses a **Fixed Grid** approach for primary content delivery to ensure an optimal reading measure.

- **Grid System:** A 12-column grid on desktop with 24px gutters.
- **Horizontal Rhythm:** Content is centered with a maximum width of 1280px. On mobile, margins scale down to 16px to maximize real estate, while desktop maintains a comfortable 40px padding.
- **Vertical Rhythm:** Built on an 8px base unit. Hero sections utilize significant vertical padding (up to 128px) to establish hierarchy and prestige.
- **Breakpoints:** Transitions occur at 768px (Tablet) and 1024px (Desktop).

## Elevation & Depth

Elevation is primarily communicated through **Tonal Layers** and **Subtle Glassmorphism**.

- **Surfaces:** Depth is created by shifting from the base parchment color to slightly cooler or warmer "Surface Containers" (Low/High/Highest) rather than heavy shadows.
- **Glass Effects:** Top navigation and hero media containers use a `backdrop-blur` (MD) with semi-transparent white overlays to create a sense of lightness and technical sophistication.
- **Shadows:** Only used for "floating" elements like book cards or dropdowns. These are extremely soft, low-opacity (5-10%) shadows tinted with the primary amber color to keep them integrated with the palette.
- **Borders:** "Ghost borders" using `outline-variant` at 40-50% opacity are the primary method of defining structural boundaries.

## Shapes

The shape language is conservative and professional, leaning towards **Soft** roundedness.

- **Standard Elements:** Buttons and small containers use a subtle 4px (0.25rem) radius.
- **Information Containers:** Cards and input fields utilize 8px (0.5rem) to feel more approachable.
- **Large Media:** Hero containers and featured imagery use 16px (1rem) or 24px (1.5rem) to create a "window" effect into the content.
- **Interaction Elements:** Circular shapes are reserved strictly for icons and user avatars.

## Components

### Buttons
- **Primary:** Solid `accent-warm` background with white text. 4px roundedness.
- **Secondary:** Semi-transparent white background with `accent-warm` border and text.
- **Ghost:** No background, `ink-secondary` text, shifts to `surface-container-high` on hover.

### Cards (Archives/Books)
- **Structure:** Vertical stack with a fixed aspect-ratio image (2:3) on a `surface-container-high` background.
- **Style:** Subtle 1px border (`outline-variant/40`), light `shadow-sm`, and 12px padding.

### Navigation
- **Top Bar:** Sticky, 64px height, semi-transparent background with a subtle bottom border.
- **Active State:** Indicated by a 2px bottom border in `accent-warm` and bolded text.

### Imagery
- **Media Containers:** All images should have a 90% opacity overlay or sit behind a gradient to ensure text readability if used as backgrounds.
- **Placeholder:** Geometric/Abstract illustrations in the brand palette.