# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Development Guidelines

## Project Context
This is a React TypeScript frontend for a sports card inventory management application. The application allows users to manage collections of sports cards across different brands, sets, and sports.

## Key Architecture Decisions

### Data Structure
- **Hierarchical**: Brand → Set → Card → Parallel
- **User Collections**: Users create Collections containing CardRecords
- **CardRecord**: Links cards to collections with metadata (purchase info, SKU, notes)

### Technology Stack (Implemented)
- **React 19.1** with TypeScript 5.8
- **Vite 7.1** for build tooling and dev server
- **TailwindCSS 4.1** with @tailwindcss/postcss for styling
- **Zustand 5.0** for client state management
- **React Router 7.8** for routing
- **React Hook Form 7.62** for form handling

### Planned Technologies
- **React Query** for server state management (not yet implemented)
- **Vitest + React Testing Library** for testing (not yet configured)

## Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server (defaults to port 5173)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Note**: There are no test commands configured yet in package.json. TypeScript checking is done during build.

## Authentication Architecture

The application includes a complete JWT-based authentication system:

### Authentication Flow
1. **Login/Register**: Forms use React Hook Form with validation
2. **Token Management**: JWT tokens stored in localStorage with automatic expiry checking
3. **Protected Routes**: ProtectedRoute component guards authenticated pages
4. **State Management**: Zustand store handles auth state globally
5. **API Integration**: AuthService class handles all auth API calls to backend at `localhost:8000`

### Key Auth Components
- `src/stores/auth.ts` - Central authentication state management
- `src/services/auth.ts` - API service for authentication endpoints
- `src/components/auth/` - Login, Register, and ProtectedRoute components
- `src/hooks/useTokenRefresh.ts` - Automatic token expiry handling

### Backend API Expectations
- `POST /auth/login` - Form-encoded credentials (not JSON)
- `POST /auth/register` - JSON payload
- `GET /auth/me` - Get current user with Bearer token
- `POST /auth/logout` - Logout endpoint

## Code Standards

### File Organization (Current Structure)
```
src/
├── components/
│   ├── ui/           # Button, Input, Alert components
│   └── auth/         # LoginForm, RegisterForm, ProtectedRoute
├── pages/            # LoginPage, RegisterPage, DashboardPage
├── hooks/            # useTokenRefresh
├── services/         # auth.ts API service
├── stores/           # auth.ts Zustand store
├── types/            # auth.ts TypeScript interfaces
└── utils/            # (empty - for future utilities)
```

### Naming Conventions
- **Components**: PascalCase (CardList, CollectionForm)
- **Hooks**: camelCase starting with 'use' (useCardSearch, useCollection)
- **Types**: PascalCase (CardRecord, Collection, Brand)
- **Files**: kebab-case for pages, PascalCase for components

### Component Patterns
- Use functional components with hooks
- Extract custom hooks for complex logic
- Prefer composition over inheritance
- Use TypeScript interfaces for props

### API Integration
- **Current**: Direct service class pattern (AuthService) with Zustand for state
- **Future**: Plan to use React Query for server state management
- Create service functions in `src/services/`
- Handle loading, error, and success states consistently
- Base API URL is `http://localhost:8000`

### Mobile-First Development
- Design for mobile first, enhance for desktop
- Use touch-friendly hit targets (minimum 44px)
- Implement swipe gestures where appropriate
- Consider offline functionality for field use

### Dark Mode Design
- Application uses dark theme by default with gray-900/gray-800 backgrounds
- TailwindCSS classes focus on dark color palette
- Blue accent colors (blue-600/blue-700) for primary actions
- Proper contrast ratios maintained throughout

### Performance Considerations
- Implement virtual scrolling for large card lists
- Use React.memo for expensive renders
- Lazy load images and large datasets
- Consider service worker for offline support

## Domain-Specific Notes

### Card Management
- Cards can have multiple parallels (variants with different print runs)
- Serial numbers are optional and specific to parallels
- Support for different card conditions (Mint, Near Mint, etc.)

### Collection Features
- Users can have multiple collections (personal, investment, trade, etc.)
- CardRecords track ownership status: owned, sold, wanted
- Financial tracking for purchase/sale prices and dates
- Custom SKU system for inventory management

### Search & Filtering
- Search by player name, team, card number, or custom SKU
- Filter by sport, brand, set, year, condition
- Advanced filters for parallel types and print runs

### Import/Export
- Support bulk import of set data from external sources
- Export collections in various formats (CSV, JSON)
- Handle large datasets efficiently

## Development Patterns

### TypeScript Import Style
- Use `import type` for type-only imports (required by current tsconfig)
- Example: `import type { ReactNode } from 'react'` instead of `import { ReactNode }`

### Zustand Store Pattern
- Store actions as async methods within the store definition
- Handle loading states, errors, and success states in store methods
- Example pattern from auth store: set loading → try API call → set success/error state

### TailwindCSS + PostCSS Configuration
- Uses @tailwindcss/postcss plugin (not the old tailwindcss plugin)
- Custom dark theme colors defined in tailwind.config.js
- Base styles in index.css use regular CSS, not @apply directives

## Troubleshooting

### Common Issues
- **TypeScript errors**: Use `import type` for type-only imports due to verbatimModuleSyntax
- **TailwindCSS build errors**: Ensure using @tailwindcss/postcss plugin, not legacy tailwindcss plugin
- **Timer types**: Use `number` instead of `NodeJS.Timeout` for setInterval/setTimeout return types

### Performance Issues
- Check React DevTools Profiler
- Implement proper memoization
- Optimize image loading and lazy loading
- Review bundle size with build analyzer

## Future Considerations

### Scalability
- Consider micro-frontends if application grows significantly
- Implement proper caching strategies
- Plan for real-time features (notifications, live updates)

### Advanced Features
- PWA capabilities for offline use
- Barcode/QR code scanning for mobile
- Integration with card pricing APIs
- Social features for trading and sharing collections