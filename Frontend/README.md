# The Daily Edit - Frontend

Premium digital publication and online utility platform for technology and knowledge publishing.

## Architecture

### Folder Structure

```
src/
├── app/                          # Core application (providers, router, layouts, config)
├── presentation/                 # UI layer (components, primitives, layouts, animations)
├── application/                  # Use cases and services (state orchestration, queries)
├── domain/                       # Business entities and rules
├── infrastructure/              # API clients and adapters
├── modules/                     # Feature modules (articles, tools, admin, etc.)
├── assets/                      # Images, icons, and media
└── ui/                           # Design system components (re-exported from presentation)
```

### Layer Architecture

#### Layer 1 — Presentation
- Components, layouts, and UI primitives
- Design system (buttons, cards, nav, forms, modals)
- Animations (GSAP, Framer Motion)
- Responsive layouts and design tokens

#### Layer 2 — Application
- Use cases and business logic
- State orchestration and query management
- Feature workflows and commands

#### Layer 3 — Domain
- Business entities and value objects
- Domain rules and validation
- Domain interfaces and services

#### Layer 4 — Infrastructure
- HTTP API clients and data adapters
- External service integration
- Persistence adapters and browser storage

## Design System

This frontend uses a comprehensive design system based on UI/UX Pro Max recommendations:

### Typography
- **Headings:** Cormorant — premium serif for magazine-style headlines
- **Body:** Montserrat — highly readable sans-serif for body copy

### Color Palette
- **Primary:** #1C1917 (premium black)
- **Accent:** #A16207 (gold for CTAs and highlights)
- **Background:** #FAFAF9 (warm off-white)
- **Foreground:** #0C0A09 (rich black)
- **Card:** #FFFFFF (white cards with subtle shadow)

### Core Principles
- Editorial minimalism with generous whitespace
- Swiss-inspired grid layouts with strong visual hierarchy
- Sophisticated hover states and micro-interactions
- Mobile-first responsive design

## Technologies

- React 19 + TypeScript + Vite + Tailwind CSS
- React Router, Framer Motion, GSAP, Lenis
- TanStack Query, React Hook Form, Zod
- Lucide React, Axios

## Development

```bash
npm run dev       # Run dev server
npm run build     # Production build
npm run lint      # Lint code
npm run preview   # Preview build
```

## Modules

- **Home:** Editorial homepage with featured stories and categories
- **Articles:** Reading experience with TOC, related articles, SEO
- **Tools:** Image, PDF, text, and productivity tools (32 total)
- **Admin:** CMS dashboard with auth, article management, SEO, ads
- **Legal:** Privacy, terms, editorial policy pages

## Backend API

The frontend connects to `/api/*` endpoints on the backend for all data operations.

## Deployment

Build output in `dist/`. Configure for static hosting with proper caching and HTTPS.
