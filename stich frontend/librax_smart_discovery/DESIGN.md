---
name: LibraX Smart Discovery
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
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#081b3a'
  on-primary-container: '#7384a8'
  inverse-primary: '#b6c6ee'
  secondary: '#4950c7'
  on-secondary: '#ffffff'
  secondary-container: '#7d85fe'
  on-secondary-container: '#060693'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#291800'
  on-tertiary-container: '#a07e4e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b6c6ee'
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
  status-available: '#2D6A4F'
  status-issued: '#BA1A1A'
  status-reserved: '#E36414'
  admin-table-header: '#EFEDF0'
  map-grid-line: '#C5C6CF'
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
  margin-desktop: 40px
  margin-mobile: 16px
  table-cell-px: 16px
  table-cell-py: 12px
---

## Brand & Style

This design system evolves "Academic Editorial" into a high-performance discovery environment. The brand personality is **Intellectually Precise**—combining the quiet authority of a traditional library with the analytical "smart" capabilities of modern data science. It is designed for students, researchers, and library administrators who require both deep focus and rapid information retrieval.

The design style is a hybrid of **Minimalism** and **Modern Corporate**, leaning into technical precision. While it retains the spaciousness of editorial design, it introduces rigid structural elements (lines, data grids, and status indicators) that signal efficiency and "real-time" intelligence. The aesthetic should feel organized, architectural, and sophisticated.

## Colors

The color system utilizes semantic remapping to support both light and dark modes. The **Primary** navy remains the anchor for authority, while the **Secondary** violet is used for "Smart" interactions and active discovery states.

- **Status Indicators:** We introduce a specific functional palette for real-time states: Green (Available), Red (Issued/Overdue), and Amber (Reserved). These must maintain high contrast ratios against both the light paper-stock backgrounds and dark-mode surfaces.
- **Admin Surfaces:** High-contrast data environments use a refined grayscale to differentiate between metadata and actionable data points.
- **Dark Mode:** In dark mode, surfaces shift to `#1B1B1E`. The primary navy container lightens slightly to `#1A2B4B` to maintain depth visibility without losing brand identity.

## Typography

This system continues to use **Plus Jakarta Sans** for its balance of geometric clarity and approachability. 

For the "Smart" evolution, we introduce a **Data Mono** style (using a system monospace font) for ISBNs, Call Numbers, and administrative IDs. This adds a layer of technical "accuracy" to the editorial base. Headlines use tight tracking for a curated feel, while metadata and labels utilize `label-caps` to create clear visual separation between content and categorization.

## Layout & Spacing

The layout utilizes a **12-column Fluid-Fixed hybrid grid**. The main content area is capped at 1280px for readability, but "Smart" dashboards and Admin tables may expand to fill the viewport width to maximize data density.

Spacing follows an 8px linear rhythm. For technical components like data tables and mapping tools, we utilize a condensed spacing model (4px increments) to allow for the display of complex information without excessive scrolling. On mobile, margins reduce to 16px, and complex tables transition to cards or horizontally scrollable containers.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**. 

- **Discovery Layer:** Main background uses the neutral surface color.
- **Smart Components:** Real-time indicators and maps sit on a Level 1 surface (Pure White in Light mode / `#303033` in Dark mode) with a 1px `outline-variant` border.
- **Elevation:** Use shadows only for floating elements like "Quick View" book modals. The shadow should be highly diffused (0.04 alpha) and tinted with the Primary Navy color to ensure it feels integrated into the environment rather than a generic UI element.

## Shapes

The system adopts a **Soft (0.25rem)** roundedness for standard UI elements (inputs, buttons, chips) to communicate technical precision. 

Large-scale containers like book hero sections or library maps use `rounded-lg` (0.5rem) to maintain the premium, editorial feel. Status indicators (dots/pills) are the only elements allowed to be fully rounded (`rounded-full`) to contrast against the otherwise structured, rectilinear layout.

## Components

### Status Indicators
- Use `rounded-full` dots (8px) paired with `label-caps` text. 
- Available: `#2D6A4F` dot; Issued: `#BA1A1A` dot; Reserved: `#E36414` dot.

### High-Contrast Data Tables
- Header: `label-caps` on `admin-table-header`. 
- Rows: 1px horizontal `outline-variant` borders. Use `data-mono` for IDs and numeric values. 
- Zebra-striping is applied in Admin views for row tracking across wide screens.

### Location-Mapping
- Maps use a simplified, architectural style with `map-grid-line` strokes.
- Current user location indicated with the Secondary violet color.
- Book locations highlighted with a Primary navy pulse effect.

### Input Fields
- Technical focus: 1px border. On focus, the border shifts to Primary Navy with no outer glow, emphasizing a crisp, "smart" interface.

### Chips & Tags
- 4px radius. Use a light tint of the Primary color for generic metadata and a tinted Secondary for "Smart" suggestions (e.g., "Trending in your field").