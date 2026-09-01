---
name: Academic Editorial
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
  surface-light: '#fbf8fc'
  surface-dark: '#1a2b4b'
  on-surface-light: '#1b1b1e'
  on-surface-dark: '#f2f0f3'
  accent-violet: '#7d84fe'
  warm-gray: '#e4e2e5'
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
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-max: 1280px
---

## Brand & Style

This design system is built upon a foundation of **Academic Minimalism**. It rejects the hyper-saturated, generic aesthetic of modern SaaS in favor of a sophisticated, human-centered editorial approach. The goal is to evoke the feeling of a high-end physical library—quiet, organized, and premium—while maintaining the efficiency of a digital tool.

The visual language prioritizes clarity and intent. It utilizes generous whitespace to reduce cognitive load for students and faculty, favoring structured layouts over decorative elements. The emotional response should be one of focused calm, reliability, and intellectual prestige.

## Colors

The palette is anchored by a deep navy, grounding the interface in a sense of established authority. The system supports a seamless transition between Light and Dark modes to accommodate different reading environments.

- **Light Mode:** Uses a warm off-white (#fbf8fc) as the primary surface to mimic high-quality paper stock, reducing eye strain during long research sessions.
- **Dark Mode:** Transitions to deep navy and indigo tones (#1a2b4b) for a focused, low-light reading experience.
- **Primary & Secondary:** The deep navy remains the primary brand anchor, while a muted violet is used for active states and highlights.
- **Functional Accents:** Success, Warning, and Danger colors are intentionally desaturated to remain harmonious with the professional tone.

## Typography

The typography leverages **Plus Jakarta Sans** for its refined, contemporary feel that remains highly legible across academic contexts.

- **Display & Headlines:** Utilize bold weights with slight negative letter-spacing to create a distinctive, authoritative "editorial" header style.
- **Body Text:** Set with generous line-height (1.6x) to ensure readability for dense bibliographic data or long descriptions.
- **Labels:** Use uppercase styling with increased letter-spacing for metadata, category tags, and secondary navigation items to distinguish them clearly from prose.

## Layout & Spacing

The layout is governed by a **fixed-width 12-column grid** on desktop, centered to create a focused reading experience. On mobile, it transitions to a single-column fluid layout with 16px side margins.

Spacing follows a strict 8px linear scale. Large-scale whitespace (64px+) should be used between major sections to emphasize the "minimalist" nature of the platform. Navigation sidebars are fixed to the left with a width of 240px, while content areas expand to fill the remaining grid columns.

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **tonal layers** and ultra-subtle borders to maintain its editorial integrity.

- **Level 0 (Base):** Warm off-white background in light mode; deep navy in dark mode.
- **Level 1 (Cards/Containers):** Elevated by contrast using pure white (light) or a slightly lighter navy (dark) with 1px borders (#E5E7EB or #c5c6cf).
- **Level 2 (Interactive/Floating):** Surfaces utilize a very soft, diffused shadow with a 4% opacity tint of the primary color.
- **Glassmorphism:** Navigation bars may use a subtle backdrop blur (12px) with 80% opacity to maintain context of the underlying content.

## Shapes

The shape language is "Soft-Modern." Primary containers, buttons, and input fields utilize an 8px radius. This provides a human, approachable feel without becoming overly "bubbly."

Large-scale components, such as book covers or hero banners, use a more pronounced 16px radius (`rounded-lg`) to signal their importance as featured content.

## Components

### Theme Switcher
Located in the top utility navigation. A toggle or segmented control allowing users to switch between "Light," "Dark," and "System" modes. Icons should be minimal line-art.

### Buttons
- **Primary:** Solid primary color background with white text. 1px border of the same color.
- **Secondary:** Transparent background with a 1px primary color border and primary color text.
- **States:** Subtle opacity shift (0.9) on hover; avoid significant color or size shifts.

### Input Fields
- 1px border (#E5E7EB). On focus, the border changes to the Primary Navy with a subtle 2px violet outer glow.
- Labels are strictly positioned above the field, never as placeholders, to ensure accessibility and clarity.

### Cards & Book Covers
- **Book Cards:** 2:3 aspect ratio for cover imagery. Include a 1px internal border on images to define edges against white backgrounds.
- **Lists:** Horizontal list items for bibliographic data use 1px horizontal dividers only, with no vertical borders.

### Chips & Badges
- Muted backgrounds using 10% opacity of the functional color with full-color text. Use a 4px radius for a sharper, more professional look.