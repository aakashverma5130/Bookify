---
name: Natural Academic
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#434842'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737872'
  outline-variant: '#c3c8c0'
  surface-tint: '#4f6350'
  primary: '#4d614e'
  on-primary: '#ffffff'
  primary-container: '#657a66'
  on-primary-container: '#f7fff3'
  inverse-primary: '#b6ccb5'
  secondary: '#486173'
  on-secondary: '#ffffff'
  secondary-container: '#c8e3f8'
  on-secondary-container: '#4c6678'
  tertiary: '#894b35'
  on-tertiary: '#ffffff'
  tertiary-container: '#a6634b'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e9d0'
  primary-fixed-dim: '#b6ccb5'
  on-primary-fixed: '#0d1f11'
  on-primary-fixed-variant: '#384b3a'
  secondary-fixed: '#cbe6fb'
  secondary-fixed-dim: '#afcadf'
  on-secondary-fixed: '#011e2e'
  on-secondary-fixed-variant: '#304a5b'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#6f3722'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
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
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is built upon a "Modern Library" aesthetic—blending the intellectual weight of academia with the organic warmth of nature. The target audience includes students, researchers, and bibliophiles who seek a focused yet serene environment for knowledge management.

The style is a hybrid of **Minimalism** and **Tactile Design**. It avoids the sterility of pure digital interfaces by using a paper-inspired color palette and subtle physical metaphors. The interface should feel "quiet," prioritizing content (books and data) over flashy UI ornaments. Every interaction should evoke the tactile satisfaction of turning a high-quality paper page or resting a hand on a polished oak reading table.

## Colors
The palette is grounded in low-saturation, earthy tones to reduce eye strain during long reading sessions.
- **Primary (Sage Green):** Used for main actions, active navigation states, and "Available" status. It represents growth and focus.
- **Secondary (Soft Blue):** Used for information highlights, badges, and "Reserved" status. It provides a calming contrast to the warm base.
- **Tertiary (Terracotta/Brown):** Reserved for "Overdue" alerts and decorative book-inspired accents. It adds a grounded, traditional academic feel.
- **Base Layers:** The background uses a warm Ivory (`#F9F7F2`) to mimic premium book paper, while cards and containers use an even lighter Cream (`#FDFCF8`) to create soft, legible layers.
- **Typography:** Headlines use a deep Charcoal (`#333333`) for maximum legibility, while body text uses a slightly muted slate gray to soften the reading experience.

## Typography
Plus Jakarta Sans is the sole typeface, chosen for its modern geometric clarity balanced with warm, open counters. 
- **Headlines:** Use Bold or SemiBold weights in Dark Charcoal. For larger displays, a slight negative letter-spacing should be applied to keep the "academic title" feel compact and authoritative.
- **Body:** Use Regular weight with generous line-height (1.5x minimum) to ensure a comfortable reading rhythm reminiscent of a well-typeset book.
- **Labels:** Use Medium or SemiBold weights with slight tracking (letter-spacing) to distinguish functional UI elements from narrative content.

## Layout & Spacing
This design system employs a **Fixed Grid** philosophy for desktop to maintain a structured, "catalog" feel, while transitioning to a fluid model for mobile devices.

- **Desktop:** 12-column grid, 1280px max-width, 24px gutters. Content is often centered with generous "margin air" to simulate the margins of a printed page.
- **Mobile:** 4-column fluid grid with 16px side margins. 
- **Spacing Rhythm:** Based on an 8px scale. Use 24px (`md`) for standard padding between grouped elements and 48px (`lg`) to separate major sections. The "Academic" feel is achieved through intentional white space—err on the side of more space rather than less to maintain the calm atmosphere.

## Elevation & Depth
Depth is communicated through **Tonal Layering** supplemented by **Soft Physical Shadows**. 
- **Level 0 (Background):** Ivory base.
- **Level 1 (Cards/Containers):** Cream surface with a 1px border in a slightly darker cream (2% darker than surface) and a very soft, diffused shadow (15% opacity, 10px blur, 2px offset).
- **Level 2 (Interactive/Floating):** Used for active buttons or modals. These use a 3D "tactile" feel—a subtle inner shadow on the top edge and a slightly more pronounced drop shadow to make the element feel like it is physically raised off the paper surface.
- **Transitions:** When hovering over book cards or list items, the shadow should slightly expand and the element should lift by 2px, mimicking the physical action of picking up a volume.

## Shapes
The shape language follows a "Structured Softness" approach.
- **Standard Radius:** 8px (`rounded-md` / value: 2) is the default for buttons, input fields, and small cards. This provides a modern, approachable feel while maintaining the structural integrity of a library grid.
- **Large Radius:** 16px (`rounded-lg`) is used for primary dashboard cards and modals.
- **Pill Shapes:** Used exclusively for status chips (Available, Reserved, etc.) to distinguish them from functional buttons.

## Components
- **Buttons:** Primary buttons use the Sage Green background with white text. They should have a subtle "pressed" state where the shadow disappears, simulating a physical button click.
- **Book Cards:** These are the heart of the system. They feature a Cream background, the 8px radius, and a subtle "spine-like" accent on the left border using the primary or status colors.
- **Chips/Status Badges:** Pill-shaped with a low-opacity background of the status color and high-opacity text of the same color (e.g., Soft Blue background at 15% for "Reserved" text).
- **Input Fields:** Soft Ivory background with a 1px border. On focus, the border transitions to Sage Green with a 2px "glow" (diffused shadow) to guide the user's attention.
- **Lists:** Use clean dividers in a very faint grey-gold. Every list item should have a generous height to ensure the "Natural" spaciousness of the system is maintained.
- **Book Progress Bars:** Use a thin, elegant line. The "track" is a light cream and the "fill" is Sage Green, terminating in a soft rounded tip.