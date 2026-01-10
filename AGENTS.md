# NextBB Project Guidelines

## Overview

NextBB is a modern forum application with responsive design for desktop, tablet, and mobile devices.

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Prisma ORM + PostgreSQL
- **Authentication**: NextAuth.js
- **Data Fetching**: SWR
- **Internationalization**: next-intl (never type, no route prefix)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Commands

### Development

```bash
pnpm dev              # Start development server
pnpm build            # Build for production (runs prisma generate + next build)
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database

```bash
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:validate  # Validate Prisma schema
pnpm prisma:studio    # Open Prisma Studio
pnpm db:pull          # Pull database schema
pnpm db:push          # Push schema changes
```

### Single Test L /int (if available)

```bash
pnpm lint             # Run linting on entire project
```

## Code Style

### TypeScript

- **Strict TypeScript**: Always enable strict mode
- **No `any`**: Never use `any` type - use `unknown` or specific types instead
- **Explicit Types**: All function parameters, return values, and variables must have explicit type declarations
- **Type Inference**: Use inference for obvious cases, but always declare complex types explicitly

### File Naming

- **Files**: All files use kebab-case (e.g., `user-overview-client.tsx`, `utils.ts`, `api-helper.ts`)
- **Components**: Named exports with PascalCase (e.g., `export function UserOverviewClient(...)`)
- **Pages**: kebab-case for route segments (e.g., `[locale]/(main)/checkin/page.tsx`)

### Component Structure

```tsx
// 1. "use client" directive (client components only)
"use client"

// 2. Third-party imports
import useSWR from "swr"
import { motion, Variants } from "motion/react"

// 3. Internal UI component imports
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 4. Icon imports (lucide-react)
import { Activity, MessageSquare, ThumbsUp } from "lucide-react"

// 5. next-intl imports
import { useTranslations } from "next-intl"

// 6. Relative imports from same/directory components
import { TopContentSection } from "./top-content-section"

// 7. Type definitions
type OverviewStatsProps = {
  userId: string
}

// 8. Constants and utilities
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// 9. Component definition
export function UserOverviewClient({ userId }: OverviewStatsProps) {
  const t = useTranslations("User.profile.overview")
  // Component logic
}
```

### Imports Order

1. `"use client"` directive
2. Third-party libraries (SWR, Framer Motion, etc.)
3. UI component library (@/components/ui/\*)
4. Icons (lucide-react)
5. Internationalization (next-intl)
6. Relative imports (./, ../)

### Formatting (Prettier)

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "bracketSpacing": true,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### Error Handling

- Use try-catch for async operations
- Return fallback UI for errors (e.g., error states in components)
- Handle SWR error states: `const { data, error, isLoading } = useSWR(...)`

### React Components

- Use function components with React Hooks
- Use named exports for components: `export function ComponentName(...)`
- Use `Skeleton` component for loading states
- Separate animation variants into constants when complex

### State Management

- **Server State**: Use SWR for data fetching and caching
- **Client State**: Use React hooks (useState, useReducer)
- **Form State**: React Hook Form + Zod resolvers

### Database (Prisma)

- Define all data models in `prisma/schema.prisma`
- Use Prisma Client for type-safe database operations
- Run `pnpm prisma:generate` after schema changes

### Internationalization

- All user-facing text must use `next-intl`
- Configuration: `never` type (no locale route prefix `/[locale]`)
- Translation files: `i18n/messages/*.json`
- Usage: `const t = useTranslations("Namespace.key")`

### Responsive Design

- Use Tailwind CSS breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Mobile-first approach
- Test on all device sizes

### CSS Classes

- Use `shadow-none` for clean card designs (per project convention)
- Use `text-muted-foreground` for secondary text
- Consistent spacing with Tailwind utilities

## Documentation References

- Next.js v16 uses `proxy.ts` instead of `middleware.ts` for locale configuration
- For package-specific features, use context7-matched version documentation
- Refer to `back.md` for additional context on project-specific patterns

## Paths Alias

```json
{
  "@/*": ["./src/*"]
}
```

All imports use `@/` prefix for src directory.
