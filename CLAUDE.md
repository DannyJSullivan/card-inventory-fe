# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Context

This is a React TypeScript frontend for a sports card inventory management application. The application allows users to manage collections of sports cards across different brands, sets, and sports.

## Implementation Status

### ✅ Currently Implemented
- Complete JWT-based authentication system (login, register, logout)
- Modern theme system with light/dark mode support
- Responsive dashboard layout
- Settings dropdown with theme toggle (accessible only after login)
- CSS-based styling architecture with custom properties

### 🚧 Planned (Not Yet Implemented)
- Card collection management
- Card CRUD operations
- Search and filtering functionality
- Collection analytics
- Import/export features

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (defaults to port 5173)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Note**: No test commands are configured yet in package.json. TypeScript checking is done during build.

## Technology Stack

- **React 19.1** with TypeScript 5.8
- **Vite 7.1** for build tooling and dev server
- **TailwindCSS 4.1** with @tailwindcss/postcss for styling framework
- **CSS Custom Properties** for theme system (data-theme attribute)
- **Zustand 5.0** for client state management
- **React Router 7.8** for routing
- **React Hook Form 7.62** for form handling
- **Future**: React Query for server state management (not yet implemented)

## Architecture Overview

### Authentication Flow
1. **Registration/Login**: React Hook Form validation → Zustand store actions → AuthService API calls
2. **Token Management**: JWT stored in localStorage with automatic expiry checking
3. **Route Protection**: ProtectedRoute component guards authenticated pages
4. **Session Management**: useTokenRefresh hook handles token expiry and auto-logout

### Theme System Architecture
- **CSS Custom Properties**: All colors and styling defined as CSS variables in index.css
- **Theme Context**: React context manages theme state and applies `data-theme` attribute to document
- **Automatic Switching**: Light/dark themes controlled via `data-theme="light|dark"` on document element
- **Settings Integration**: Theme toggle only available in settings dropdown after login

### Component Architecture
- **Functional Components**: All components use hooks pattern
- **CSS Classes**: Components use semantic CSS classes instead of inline styles
- **Type Safety**: Comprehensive TypeScript interfaces for all props and state
- **Form Handling**: React Hook Form for all user input forms

## Key Implementation Details

### CSS Architecture
The application uses a modern CSS architecture with custom properties for theming:

```css
:root { /* Light theme variables */ }
[data-theme="dark"] { /* Dark theme variables */ }
```

- **Component Classes**: `.auth-container`, `.dashboard-card`, `.form-input`, etc.
- **Theme-Aware**: All colors use CSS custom properties that automatically switch
- **Reusable**: Semantic class names for consistent styling across components

### Authentication State Management
```typescript
// Zustand store pattern
const useAuthStore = create<AuthStore>((set, get) => ({
  // State: user, token, isAuthenticated, isLoading, error
  // Actions: login, register, logout, clearError, checkAuth
}))
```

### Backend Integration
- **Base API URL**: `http://localhost:8000`
- **Authentication Endpoints**:
  - `POST /auth/login` - Form-encoded credentials (not JSON)
  - `POST /auth/register` - JSON payload
  - `GET /auth/me` - Get current user with Bearer token
  - `POST /auth/logout` - Logout endpoint

### File Organization
```
src/
├── components/
│   ├── ui/           # Reusable UI components (Alert, SettingsDropdown, etc.)
│   └── auth/         # Auth-specific components (LoginForm, RegisterForm, ProtectedRoute)
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks (useTokenRefresh)
├── services/         # API integration layer (AuthService)
├── stores/           # Zustand state management
├── contexts/         # React contexts (ThemeContext)
├── types/            # TypeScript type definitions
└── utils/            # Shared utilities (currently empty)
```

## Development Patterns

### TypeScript Import Style
```typescript
import type { ReactNode } from 'react'  // Type-only imports
import { useState } from 'react'         // Runtime imports
```

### Component Pattern
```typescript
interface ComponentProps {
  // Props definition
}

export const Component = ({ prop }: ComponentProps) => {
  // Component implementation with hooks
  return <div className="semantic-css-class">...</div>
}
```

### Zustand Store Pattern
```typescript
export const useStore = create<StoreType>((set, get) => ({
  // State properties
  action: async () => {
    set({ isLoading: true })
    try {
      // API call
      set({ data, isLoading: false })
    } catch (error) {
      set({ error, isLoading: false })
    }
  }
}))
```

### Settings Dropdown Behavior
- **Theme Toggle**: Keeps dropdown open (state-only change)
- **Logout**: Closes dropdown before navigation
- **Future Navigation Items**: Should close dropdown before navigating

## Data Structure (Planned)
```
Brand → Set → Card → Parallel
User → Collection → CardRecord → Card/Parallel
```

- **CardRecord**: Links cards to collections with metadata (purchase info, SKU, notes)
- **Collections**: Users can have multiple collections (personal, investment, trade)
- **Parallels**: Card variants with different print runs and serial numbers

## Common Issues & Solutions

### TypeScript Errors
- Use `import type` for type-only imports due to verbatimModuleSyntax setting
- Use `number` instead of `NodeJS.Timeout` for timer return types

### Theme System
- Themes are controlled by `data-theme` attribute on document element
- CSS custom properties handle all color switching automatically
- Never mix inline styles with theme system - use CSS classes

### Authentication Flow
- Token stored in localStorage with automatic expiry checking
- `checkAuth()` called on app initialization to restore session
- Protected routes redirect to login if not authenticated

### CSS/Styling
- Use semantic CSS classes defined in index.css
- Avoid inline styles - all styling should use CSS custom properties
- Components focus on logic, CSS handles all presentation

## Mobile-First Design Principles
- Touch-friendly hit targets (minimum 44px)
- Responsive grid layouts with CSS Grid
- Dark theme optimized for readability
- Card-based interface suitable for mobile screens

## Future Development Notes

### Planned Features
- React Query integration for server state management
- Card collection CRUD operations
- Advanced search and filtering
- Collection analytics dashboard
- Import/export functionality
- Virtual scrolling for large card lists

### Performance Considerations
- Implement React.memo for expensive renders
- Lazy load images and large datasets
- Consider service worker for offline support
- Virtual scrolling for large card collections