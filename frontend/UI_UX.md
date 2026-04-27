---
name: Amber & Ether
colors:
  surface: '#fff8f4'
  surface-dim: '#e7d7c9'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e5'
  surface-container: '#fbebdd'
  surface-container-high: '#f5e6d7'
  surface-container-highest: '#f0e0d1'
  on-surface: '#221a12'
  on-surface-variant: '#534434'
  inverse-surface: '#382f25'
  inverse-on-surface: '#feeedf'
  outline: '#867461'
  outline-variant: '#d8c3ad'
  surface-tint: '#855300'
  primary: '#855300'
  on-primary: '#ffffff'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#ffb95f'
  secondary: '#665f3d'
  on-secondary: '#ffffff'
  secondary-container: '#eae0b5'
  on-secondary-container: '#6a6341'
  tertiary: '#00658b'
  on-tertiary: '#ffffff'
  tertiary-container: '#1abdff'
  on-tertiary-container: '#004966'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ede3b8'
  secondary-fixed-dim: '#d1c79d'
  on-secondary-fixed: '#201c02'
  on-secondary-fixed-variant: '#4d4727'
  tertiary-fixed: '#c5e7ff'
  tertiary-fixed-dim: '#7fd0ff'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6a'
  background: '#fff8f4'
  on-background: '#221a12'
  surface-variant: '#f0e0d1'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  section-padding: 120px
  container-max-width: 1280px
  gutter: 32px
  element-gap: 24px
---

## Brand & Style

This design system is built on the principles of warmth, clarity, and connection. It aims to evoke a sense of safety and approachability, positioning the interface as a welcoming bridge between the user and the information they seek. The brand personality is nurturing and intentional, avoiding the cold clinical nature of traditional tech platforms in favor of a human-centric, "sun-drenched" aesthetic.

The visual direction combines **Minimalism** with **Glassmorphism**. By utilizing heavy whitespace and a restricted, warm color palette, the design system ensures high legibility and low cognitive load. The glassmorphic elements introduce a layer of modern sophistication, using soft transparency and blurs to create depth without cluttering the visual field.

## Colors

The palette is rooted in an organic, warm spectrum. The primary color, a vibrant **Warm Amber**, is used strategically for calls to action and critical highlights to draw the eye through the "bridge" of content. The background architecture utilizes a duo of **Cream** tones to differentiate sections without the harshness of pure white.

- **Primary (Amber):** Used for primary buttons, active states, and brand-critical icons.
- **Secondary (Pale Cream):** Used for subtle section containers and hover states on light elements.
- **Background (Soft Cream):** The foundation for all pages to maintain a paper-like, accessible warmth.
- **Text (Soft Black):** A high-contrast but slightly desaturated black to ensure long-form reading comfort while maintaining accessibility standards.

## Typography

The typographic scale in this design system prioritizes a "literary" feel for headings and a "functional" feel for the body. 

**Headings** utilize a high-contrast serif font to establish authority and warmth. The extra-large 64px hero type is designed to be the focal point, using generous line spacing to prevent the high-stroke-weight characters from feeling cramped.

**Body text** is set in a modern, friendly sans-serif. This ensures that while the headings feel classic and premium, the actual interaction and information consumption feel contemporary and effortless. Use the `body-lg` variant for introductory paragraphs to maintain the "high whitespace" philosophy.

## Layout & Spacing

This design system employs a **Fixed Grid** model centered on a 1280px container. The layout philosophy is "padding-heavy," meaning negative space is treated as a primary design element rather than an empty void. 

Sections are separated by large vertical gaps (120px+) to allow the user's eyes to rest between different content blocks. Internal component padding should be generous, typically starting at 32px for cards and containers, ensuring that glassmorphic backgrounds have enough room to showcase their blur and border effects without crowding the content.

## Elevation & Depth

Visual hierarchy is achieved through **Glassmorphism** and soft, tinted shadows. Rather than using traditional grey shadows, this design system uses very low-opacity shadows tinted with the Primary Amber color (#F59E0B) to maintain the warm aesthetic.

Elevated elements (like cards or navigation bars) should use a semi-transparent white background (70% opacity) with a `backdrop-blur-md` filter. This creates a "frosted" effect that lets the warm background colors bleed through while maintaining legibility. Each glassmorphic container must feature a subtle 1px solid white border to define its edges against the cream backgrounds.

## Shapes

The shape language is dominated by extreme roundness to reinforce the "accessible and friendly" brand promise. 

Interactive elements, specifically buttons and tags, utilize a **Rounded-Full (Pill-shaped)** profile. For larger structural elements like glassmorphic cards and input fields, the system moves to a `rounded-2xl` (1.5rem / 24px) standard. This consistency in curvature ensures that even the most technical parts of the interface feel soft and touchable.

## Components

### Buttons
Buttons are the primary interaction point and must be **Rounded-Full**. 
- **Primary:** Warm Amber background with Soft Black text. No shadow, or a very soft amber glow on hover.
- **Secondary:** Glassmorphic (70% white) with a 1px white border and Soft Black text.

### Cards
Cards are the primary container for content. They must always implement the glassmorphism stack: `bg-white/70`, `backdrop-blur-md`, `border-white/100`, and `rounded-2xl`. Padding inside cards should be no less than 40px.

### Input Fields
Inputs should mirror the card style but with a more subtle blur. Focus states should swap the white border for a 2px Warm Amber border to provide clear visual feedback.

### Chips & Tags
Used for categorization, these follow the button's Pill-shape but at a smaller scale, using the Secondary Cream (#FEF3C7) as a background to keep them distinct but secondary to main actions.

### Navigation Bar
The header should be a floating glassmorphic element, pinned to the top of the viewport with significant horizontal margins to reinforce the "bridge" metaphor.