---
name: LibraX Academic Intelligence
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#f0edf1'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#44474e'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#c5c6cf'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#4950c7'
  on-secondary: '#ffffff'
  secondary-container: '#7d85fe'
  on-secondary-container: '#060693'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#01006e'
  on-tertiary-container: '#6f77ef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bfc2ff'
  on-secondary-fixed: '#01006e'
  on-secondary-fixed-variant: '#2f35ae'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bfc2ff'
  on-tertiary-fixed: '#01006e'
  on-tertiary-fixed-variant: '#2f35ae'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
  status-available: '#2D6A4F'
  status-issued: '#BA1A1A'
  status-reserved: '#E36414'
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
  table-cell-px: 16px
  table-cell-py: 12px
---

## Brand & Style

LibraX embodies **Intellectual Precision**. The brand personality is scholarly, systematic, and authoritative, yet highly modern and accessible. It targets university students and researchers who require a high-density information environment that feels calm and organized rather than overwhelming.

The design style is **Corporate Modern with a Minimalist Academic lean**. It utilizes a structured grid, high-contrast typography, and a "clinical" color palette to evoke the feeling of a high-end digital library. The aesthetic relies on clear boundaries, purposeful whitespace, and a sophisticated use of monospaced accents to signal data accuracy and technical rigor.

## Colors

The palette is anchored in a high-contrast foundation of absolute black (`#000000`) for primary actions and headlines, creating a sense of weight and importance. 

- **Primary & Secondary:** The core utilizes deep blacks and a spectrum of "Academic Violets" (`#4950C7`). These violets provide a professional yet modern alternative to traditional blues.
- **Surface Strategy:** We use a multi-tiered grayscale for surfaces (`#FBF8FC` to `#DCD9DD`) to create subtle hierarchy without relying on heavy shadows.
- **Semantic Status:** Critical information is conveyed through a dedicated set of semantic colors: Forest Green for availability, Deep Red for issued/overdue status, and Burnt Orange for reservations. These are used sparingly in small indicators (dots/pills) to maintain the minimalist aesthetic.

## Typography

The system uses **Plus Jakarta Sans** for all primary interfaces, chosen for its clean, geometric forms that remain highly legible at small sizes. 

- **Headlines:** Use tight letter-spacing and bold weights to command attention.
- **Labels:** Small caps with generous letter-spacing (0.05em) are used for metadata, navigation, and category tags to differentiate them from body content.
- **Data Accents:** A system monospaced font is used specifically for numerical figures, codes (e.g., shelf IDs), and status counts to emphasize the "data-driven" nature of the library system.

## Layout & Spacing

LibraX uses a **Hybrid Grid System**:
- **Desktop:** A 64px fixed-width sidebar on the left with a fluid main content canvas that caps at 1280px.
- **Bento Grid:** The main dashboard employs a Bento-style layout using a standard 8px (`unit`) gap for small clusters and 24px (`gutter`) for major section separation.
- **Margins:** Desktop views use a generous 40px margin to allow the content to "breathe," while mobile collapses this to 16px to maximize utility.
- **Padding:** Internal card padding is consistently 16px to 24px depending on content density.

## Elevation & Depth

The system avoids heavy drop shadows in favor of **Tonal Layering and Low-Contrast Outlines**.

- **Surfaces:** Depth is created by placing `surface-container-lowest` (white) cards on top of `surface` or `surface-container-low` backgrounds.
- **Borders:** All containers use a 1px solid border (`outline-variant`) to define their boundaries.
- **Interaction Elevation:** On hover, surfaces shift slightly in tone (e.g., from `surface-container-low` to `high`) rather than lifting off the page.
- **The "Smart" Card:** For high-priority notifications, the `inverse-surface` (dark background) is used with a subtle `shadow-lg` to break the flat plane and signal urgency.

## Shapes

The shape language is **Structured and Softened**. 

- **Base Radius:** A default of `0.25rem` (4px) is used for small elements like book covers and small tags.
- **Container Radius:** Larger containers, cards, and primary buttons use `rounded-xl` (0.5rem to 0.75rem) to provide a modern, approachable feel that counterbalances the "cold" academic typography.
- **Circular Elements:** Avatars and notification badges use full rounding (pill-shaped) to distinguish them as interactive personal or system status elements.

## Components

- **Buttons:** Primary buttons are solid black with white text and uppercase labels. Secondary buttons use ghost borders or subtle tonal shifts.
- **Cards:** White backgrounds with `outline-variant` borders. For "Bento" items, use `surface-container-low` for background clusters.
- **Navigation:**
    - **Desktop:** Vertical sidebar with high-contrast active states using `secondary-container`.
    - **Mobile:** Top bar for branding/profile and a bottom bar for core utility navigation.
- **Book Items:** Horizontal layout for lists; grayscale covers by default that transition to color on hover to encourage interaction.
- **Input Fields:** Minimalist borders with icons inside the container (`search` icons should be fixed-left).
- **Status Indicators:** 6px circular dots placed adjacent to labels to provide quick-glance status without cluttering the UI with text labels.