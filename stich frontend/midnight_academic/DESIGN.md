---
name: Academic Glass
colors:
  surface: '#FBF8FC'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#F5F3F7'
  surface-container: '#EFEDF1'
  surface-container-high: '#E9E7EC'
  surface-container-highest: '#e4e1e5'
  on-surface: '#1b1b1e'
  on-surface-variant: '#42474f'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#737780'
  outline-variant: '#C5C6CA'
  surface-tint: '#376090'
  primary: '#154472'
  on-primary: '#ffffff'
  primary-container: '#D3E3FF'
  on-primary-container: '#b5d4ff'
  inverse-primary: '#a1c9ff'
  secondary: '#545f71'
  on-secondary: '#ffffff'
  secondary-container: '#d8e3f9'
  on-secondary-container: '#5a6577'
  tertiary: '#513b59'
  on-tertiary: '#ffffff'
  tertiary-container: '#F8D8FE'
  on-tertiary-container: '#e6c8ee'
  error: '#BA1A1A'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a1c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#1b4876'
  secondary-fixed: '#d8e3f9'
  secondary-fixed-dim: '#bcc7dc'
  on-secondary-fixed: '#111c2b'
  on-secondary-fixed-variant: '#3c4758'
  tertiary-fixed: '#f7d8ff'
  tertiary-fixed-dim: '#dabde2'
  on-tertiary-fixed: '#27142f'
  on-tertiary-fixed-variant: '#553f5d'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e5'
  glass-border: rgba(197, 198, 202, 0.4)
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  data-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter-mobile: 16px
  gutter-desktop: 24px
  card-padding: 24px
  sidebar-width: 260px
  container-margin: 32px
---

## Brand & Style
The brand identity for Bookify is "Academic Glass"—a sophisticated, approachable, and modern educational aesthetic. It targets students with a clean, high-utility interface that feels premium yet accessible. 

The design style is a hybrid of **Modern Corporate** and **Glassmorphism**. It utilizes soft backdrop blurs and subtle gradients to create a sense of depth and focus, while maintaining rigorous professional alignment through structured typography and consistent padding. The emotional goal is to evoke a sense of calm, organized intelligence, turning the often-stressful task of academic tracking into a visually pleasing, friction-free experience.

## Colors
The palette is rooted in a "Fidelity" logic where colors are used to denote hierarchy and functional state. 

- **Primary (#325C8B):** A deep, scholarly blue used for brand presence, primary actions, and active navigation states.
- **Secondary & Tertiary:** Used for supporting accents and status indicators (e.g., "Due Soon" vs "Current").
- **Surface Logic:** The system uses a nuanced grayscale for depth. The background is a slightly tinted off-white (#FBF8FC). Surfaces move from `low` (sidebar) to `base` (main content) to `high` (cards).
- **Glass Accents:** Functional containers (Hero, Featured panels) utilize semi-transparent white backgrounds with a 12px blur to separate them from the foundational layout layers.

## Typography
The system uses **Plus Jakarta Sans** as the primary typeface for its modern, friendly, yet professional character. It handles everything from massive hero displays to small body copy with high legibility. 

**JetBrains Mono** is reserved for metadata, labels, and technical data points, providing a subtle "data-driven" feel that suits an educational platform. For mobile, headline sizes are aggressively scaled down (e.g., 32px to 24px) to ensure layout integrity.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. On desktop, a fixed left sidebar (260px) provides global navigation, while the main content area occupies the remaining space with a maximum width of 1280px (7xl) centered.

- **Grid:** On desktop, a 12-column grid system is used within the main content area for internal card layouts.
- **Rhythm:** An 8px base unit (1rem = 16px) governs all spacing. 
- **Responsive Behavior:** 
  - **Desktop:** 24px gutters; sidebar is permanent.
  - **Mobile:** 16px gutters; sidebar moves to a bottom navigation bar and a hidden hamburger menu; hero sections stack vertically.

## Elevation & Depth
Depth is expressed through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

- **Tier 0:** Surface background (#FBF8FC).
- **Tier 1 (Surface-Low):** Sidebar and background utility containers.
- **Tier 2 (The Glass Layer):** Primary hero cards and sidebar detail panels use a semi-transparent white-to-gray gradient with a 12px backdrop blur and a soft 1px `glass-border`.
- **Tier 3 (Subtle Shadows):** Interactive cards use an extremely diffused, low-opacity shadow (5% opacity) to signify clickability without breaking the flat-glass aesthetic.

## Shapes
The shape language is consistently rounded to reinforce the "approachable" brand personality. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (rounded) base.
- **Containers:** Dashboard cards and glass panels use 1rem (rounded-lg) or 1.5rem (rounded-xl) for a softer, modern container feel.
- **Avatar/Icons:** Profile images and specific action buttons use "full" (9999px) for perfect circles.

## Components
- **Buttons:** 
  - *Primary:* Solid fill (#325C8B) with white text, rounded-full, 12px horizontal padding.
  - *Ghost/Secondary:* Bordered with `outline-variant`, subtle hover states that fill with `surface-container`.
- **Inputs:** Rounded-full search bars with icons on the left, using `surface-container-low` as the field fill.
- **Cards:** 
  - *Stat Cards:* 1px border (`outline-variant/60`), white background, 24px padding.
  - *Glass Cards:* Backdrop-blur (12px), gradient fill, 1px border.
- **Navigation:**
  - *Sidebar Links:* Active states use `secondary-container` backgrounds.
  - *Bottom Nav:* Mobile-only, 4-icon layout with labels using `label-caps` styling.
- **Badges/Chips:** Used for notification counts, utilizing the `error` color palette for high visibility.