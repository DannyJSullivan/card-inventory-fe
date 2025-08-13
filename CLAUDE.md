# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Context

This is a React TypeScript frontend for a sports card inventory management application. The application allows users to manage collections of sports cards across different brands, sets, and sports.

## Implementation Status

### ✅ Currently Implemented
- Complete JWT-based authentication system with enhanced token management
- Modern theme system with light/dark mode support
- Responsive dashboard layout with organized admin sections
- Settings dropdown with theme toggle (accessible only after login)
- CSS-based styling architecture with custom properties
- **Admin Management System**:
  - Card management with search, edit, create, delete, bulk operations
  - Set management with brand association and sorting
  - Brand management with search functionality
  - Player management with sport filtering and delete capabilities
  - Team management with consistent modal patterns
  - Parallel management with rarity auto-fill and print run validation
- **Data Import System**:
  - CSV file upload with Gemini processing
  - HTML file upload with PDF conversion via Gemini
  - JSON batch upload for manual data entry
  - Multi-stage workflow: Upload → Preview → Stage → Resolve → Commit
  - Player/team name resolution with candidate matching
- **Modal System Architecture**: Consistent overlay patterns with scroll lock prevention

### 🚧 Planned (Not Yet Implemented)
- Card collection management (user-facing)
- Collection analytics dashboard
- Advanced search and filtering for end users
- Public card browsing and discovery

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
2. **Enhanced Token Management**: 
   - JWT stored in localStorage with 8-hour expiry (backend configured)
   - Automatic expiry checking before API calls
   - Proactive token refresh when expiring within 60 minutes
   - Global 401 response handling with automatic logout/redirect
3. **Route Protection**: ProtectedRoute and AdminRoute components guard authenticated pages
4. **Session Management**: Background token refresh every hour, automatic cleanup on auth errors

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
  - `POST /auth/refresh` - Token refresh endpoint
- **Admin Management Endpoints**: Full CRUD for cards, sets, brands, players, teams, parallels
- **Import System Endpoints**:
  - `POST /admin/imports/upload-csv` - CSV file upload with Gemini processing
  - `POST /admin/imports/upload-html` - HTML file upload with PDF conversion + Gemini
  - `POST /admin/imports/upload-json` - Direct JSON payload upload
  - `POST /admin/imports/stage` - Stage batch for resolution
  - `GET /admin/imports/{id}/preview-groups` - Get resolution candidates
  - `POST /admin/imports/{id}/resolve` - Submit name resolutions
  - `POST /admin/imports/{id}/commit` - Finalize import batch

### File Organization
```
src/
├── components/
│   ├── ui/           # Reusable UI components (Alert, SettingsDropdown, etc.)
│   └── auth/         # Auth-specific components (LoginForm, RegisterForm, ProtectedRoute)
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks (useModalScrollLock, useDebounce)
├── services/         # API integration layer (AuthService, AdminService, ImportService)
├── stores/           # Zustand state management
├── contexts/         # React contexts (ThemeContext)
├── types/            # TypeScript type definitions (auth, imports)
└── utils/            # Shared utilities (API wrapper with 401 handling)
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
- Enhanced token management with 8-hour expiry and proactive refresh
- `checkAuth()` called on app initialization with automatic token refresh
- Global 401 handling via `apiRequest()` wrapper in utils/api.ts
- Protected routes redirect to login if not authenticated
- Background token refresh checks every hour for tokens expiring within 2 hours

### CSS/Styling
- Use semantic CSS classes defined in index.css
- Avoid inline styles - all styling should use CSS custom properties
- Components focus on logic, CSS handles all presentation
- **Modal System**: Use `useModalScrollLock` hook to prevent background scrolling
- **Admin Pages**: Consistent modal overlay patterns with click-outside-to-close

## Mobile-First Design Principles
- Touch-friendly hit targets (minimum 44px)
- Responsive grid layouts with CSS Grid
- Dark theme optimized for readability
- Card-based interface suitable for mobile screens

## Future Development Notes

### Planned Features
- React Query integration for server state management
- User-facing card collection management
- Advanced search and filtering for end users
- Collection analytics dashboard
- Public card browsing and discovery
- Virtual scrolling for large card lists

### Performance Considerations
- Implement React.memo for expensive renders
- Lazy load images and large datasets
- Consider service worker for offline support
- Virtual scrolling for large card collections

## Recent Implementation Notes

### Admin Management System Patterns
- **Consistent Modal UX**: All admin pages use modal overlays with `useModalScrollLock`
- **Search with Debouncing**: 500ms debounce on search inputs across all admin pages
- **Error Handling**: Retry buttons on failed requests with clear error messaging
- **Pagination**: Consistent 20-item page size with first/prev/next/last navigation
- **No ID Columns**: User-facing tables hide database IDs for cleaner presentation

### Import System Architecture
- **Multi-Format Support**: CSV, HTML (converts to PDF), and JSON upload options
- **Gemini Processing**: All file types processed through Gemini for data extraction
- **Stage-Resolve-Commit Workflow**: Three-phase import with name resolution step
- **Player/Team Resolution**: Candidate matching with create-if-missing options
- **Batch Management**: Track import progress and allow incremental resolution
- **Release Date Support**: Upload forms include optional release_date field for sets
- **Backend Optimizations (2024)**: Improved parallel processing efficiency with backward compatibility

### Authentication Enhancements (2024)
- **8-Hour Token Expiry**: Backend configured for longer sessions
- **Proactive Refresh**: Tokens refresh 60 minutes before expiry
- **Global 401 Handling**: `apiRequest()` wrapper handles auth errors consistently
- **Enhanced Security**: Automatic logout and redirect on authentication failures

### Development Recommendations
- **Backend Count Queries**: Admin endpoints need LEFT JOIN queries for accurate counts
- **Parallel Management**: Auto-fill rarity based on print run (1=Ultra Rare, ≤50=Super Rare, etc.)
- **Form Validation**: Use React Hook Form with TypeScript interfaces
- **API Error Handling**: Wrap all API calls with the `apiRequest()` utility
- **Import System**: All current frontend code continues to work with backend optimizations
- **Future Optimization**: Consider switching to `parallel_names` array instead of full `parallels` objects in card edits for better performance (optional)

### Backend Compatibility Notes (2024)
- **No Breaking Changes**: All existing frontend code continues to work unchanged
- **Enhanced CardEdit Schema**: Supports both `parallels` (current) and `parallel_names` (optimized) formats
- **Improved Efficiency**: Backend now processes parallels more efficiently while maintaining API compatibility
- **Release Date Support**: Backend now accepts `release_date` parameter in upload endpoints