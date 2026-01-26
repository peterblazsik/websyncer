---
name: react-best-practices
description: React and Next.js best practices for building performant, maintainable applications. Use when working with React components, hooks, state management, or Next.js features.
license: MIT
---

# React & Next.js Best Practices

This skill provides guidance for building high-quality React and Next.js applications.

## When to Use

Activate when:
- Creating new React components
- Working with hooks and state management
- Optimizing performance
- Implementing Next.js features (App Router, Server Components)
- Reviewing React code

## Component Architecture

### File Structure
```
components/
  common/          # Shared UI components
  ui/              # Primitive UI components (buttons, inputs)
  auth/            # Authentication-related components
  [feature]/       # Feature-specific components
```

### Component Guidelines

1. **Single Responsibility**: Each component does one thing well
2. **Composition over Inheritance**: Use children and render props
3. **Colocation**: Keep related files together (component, styles, tests)

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase (`UserProfile.types.ts`)

## Hooks Best Practices

### Custom Hooks
```typescript
// Good: Descriptive name, clear return type
function useAuth(): { user: User | null; isLoading: boolean; signIn: () => void } {
  // implementation
}
```

### Rules of Hooks
- Only call at the top level
- Only call from React functions
- Use exhaustive deps in useEffect

### Common Patterns
```typescript
// Debounced value
function useDebouncedValue<T>(value: T, delay: number): T

// Local storage sync
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]

// Media query
function useMediaQuery(query: string): boolean
```

## State Management

### Local State
- Use `useState` for simple component state
- Use `useReducer` for complex state logic

### Shared State
- React Context for app-wide state (auth, theme)
- URL state for shareable/bookmarkable state
- Server state with React Query/SWR

### Context Pattern
```typescript
// Create context with provider
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook for consuming
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## Performance Optimization

### Memoization
- `useMemo` for expensive calculations
- `useCallback` for stable function references
- `React.memo` for preventing unnecessary re-renders

### Code Splitting
```typescript
// Dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
});
```

### Image Optimization
- Always use `next/image` for images
- Specify width/height to prevent layout shift
- Use appropriate `priority` for above-fold images

## Next.js App Router

### Server vs Client Components
- Default to Server Components
- Add `"use client"` only when needed (interactivity, hooks, browser APIs)

### Data Fetching
```typescript
// Server Component - direct async
async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// Client Component - use hooks
function ClientPage() {
  const { data, isLoading } = useSWR('/api/data', fetcher);
}
```

### Metadata
```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
};
```

## Error Handling

### Error Boundaries
```typescript
// error.tsx in app directory
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Loading States
```typescript
// loading.tsx in app directory
export default function Loading() {
  return <Skeleton />;
}
```

## TypeScript Integration

### Props Types
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Generic Components
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
```

## Accessibility

- Use semantic HTML elements
- Include proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers
- Maintain sufficient color contrast
