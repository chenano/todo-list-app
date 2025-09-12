# Project Structure & Organization

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Auth route group with shared layout
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── layout.tsx     # Auth-specific layout
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── lists/[id]/    # Dynamic list detail pages
│   │   └── page.tsx       # Dashboard home
│   ├── demo/              # Demo/showcase pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles and CSS variables
├── components/            # Reusable UI components
│   ├── auth/              # Authentication-related components
│   ├── lists/             # List management components
│   ├── tasks/             # Task management components
│   ├── ui/                # shadcn/ui base components
│   └── layout/            # Layout components (header, nav, etc.)
├── contexts/              # React contexts for global state
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
│   ├── supabase/          # Supabase client and server configs
│   └── utils.ts           # Common utilities (cn, etc.)
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware for auth
```

## Naming Conventions

### Files & Directories
- **Pages**: Use `page.tsx` for route pages
- **Layouts**: Use `layout.tsx` for route layouts
- **Components**: PascalCase (e.g., `TaskItem.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `task-filters.ts`)
- **Types**: camelCase (e.g., `index.ts`)

### Code Conventions
- **Components**: PascalCase exports with named exports preferred
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces/Types**: PascalCase with descriptive names

## Import Patterns

### Path Aliases
- Use `@/` for all src imports: `import { Button } from '@/components/ui/button'`
- Relative imports only for same-directory files

### Import Order
1. React and Next.js imports
2. Third-party libraries
3. Internal components (`@/components`)
4. Internal utilities (`@/lib`, `@/hooks`)
5. Types (`@/types`)
6. Relative imports

## Component Organization

### UI Components (`src/components/ui/`)
- Base shadcn/ui components
- Shared across the entire application
- Include variants using `class-variance-authority`
- Export both component and variants

### Feature Components
- Organized by domain (`auth/`, `lists/`, `tasks/`)
- Include `index.ts` for clean exports
- Co-locate tests in `__tests__/` subdirectories

### Testing Structure
- Unit tests: `ComponentName.test.tsx`
- Integration tests: `ComponentName.integration.test.tsx`
- E2E tests: Located in `/e2e/` directory with `.spec.ts` extension

## State Management Patterns
- Use React Context for global state (auth, theme)
- Custom hooks for data fetching and local state
- Supabase real-time subscriptions in custom hooks
- Form state managed by React Hook Form

## File Naming Examples
```
✅ Good
- TaskItem.tsx
- useTaskFilters.ts
- task-filters.test.ts
- auth.integration.test.tsx

❌ Avoid
- taskItem.tsx
- TaskFilters.test.tsx
- auth_integration_test.tsx
```