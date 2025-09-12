# Technology Stack

## Core Framework & Language
- **Next.js 14** with App Router (not Pages Router)
- **TypeScript** with strict mode enabled
- **React 18** with modern hooks and patterns

## Styling & UI
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** components library (Radix UI primitives)
- **Lucide React** for icons
- **class-variance-authority** for component variants
- **tailwind-merge** and **clsx** for conditional classes

## Backend & Database
- **Supabase** for authentication, database, and real-time features
- **@supabase/ssr** for server-side rendering support
- **Zod** for schema validation

## Forms & State Management
- **React Hook Form** with **@hookform/resolvers**
- **date-fns** for date manipulation
- Custom hooks for state management (no external state library)

## Testing
- **Jest** with **@testing-library/react** for unit/integration tests
- **Playwright** for end-to-end testing
- **@testing-library/user-event** for user interaction testing

## Development Tools
- **ESLint** with Next.js config
- **Bundle Analyzer** for performance monitoring
- **TypeScript** strict mode with path aliases (`@/*`)

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Testing
```bash
npm run test                    # Run Jest unit tests
npm run test:watch             # Run Jest in watch mode
npm run test:coverage          # Run tests with coverage
npm run test:e2e               # Run all Playwright tests
npm run test:e2e:ui            # Run Playwright with UI
npm run test:e2e:headed        # Run Playwright in headed mode
```

### Analysis
```bash
npm run analyze      # Bundle analysis
```

## Environment Setup
- Copy `.env.local.example` to `.env.local`
- Required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase project must be configured with proper RLS policies