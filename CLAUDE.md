# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<<<<<<< HEAD
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
=======
## Project Overview

This is a FastAPI-based backend application for managing baseball card collections and inventories. **Currently in early development stage** - only user authentication is implemented. The full card inventory system is planned but not yet built.

## Implementation Status

### ✅ Currently Implemented
- User authentication system (register, login, JWT tokens)
- FastAPI application structure with routers/services/models separation
- SQLAlchemy database setup with Alembic migrations
- Pydantic schema validation
- Basic security (password hashing, JWT tokens)

### 🚧 Planned (Not Yet Implemented)
- Card-related models (Brand, Set, Card, Player, Team, Parallel)
- Collection and inventory management
- Card CRUD operations
- Advanced search and filtering
- All business logic beyond authentication

## Development Commands

### Environment Setup
- **Create virtual environment**: `python -m venv venv`
- **Activate virtual environment**: 
  - Unix/Mac: `source venv/bin/activate`
  - Windows: `venv\Scripts\activate`
- **Install dependencies**: `pip install -r requirements.txt`

### Database Operations
- **Create new migration**: `alembic revision --autogenerate -m "description"`
- **Apply migrations**: `alembic upgrade head`
- **Rollback migration**: `alembic downgrade -1`
- **Show migration history**: `alembic history`

### Development Server
- **Start development server**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Start with debug logging**: `uvicorn app.main:app --reload --log-level debug`

### Testing
- **Run all tests**: `pytest` (Note: No tests implemented yet)
- **Run tests with coverage**: `pytest --cov=app`
- **Run specific test file**: `pytest tests/test_models.py`
- **Run tests in verbose mode**: `pytest -v`

## Database Schema

### Currently Implemented Tables
- **users**: Authentication (id, username, email, hashed_password, is_active, created_at, updated_at)

### Planned Database Design
```
Brand (1) -> (Many) Set
Set (1) -> (Many) Card  
Card (1) -> (Many) Parallel
Player (Many) -> (1) Team
Card (Many) -> (1) Player
User (1) -> (Many) Collection
Collection (1) -> (Many) CardRecord
CardRecord (Many) -> (1) Card
CardRecord (Many) -> (1) Parallel [optional]
```

### Planned Tables (Not Yet Implemented)
- **brands**: Card manufacturers (id, name, description)
- **teams**: Sports teams (id, name, city, sport, league)  
- **players**: Individual players (id, name, team_id)
- **sets**: Card sets (id, name, year, sport, brand_id)
- **cards**: Individual cards (id, card_number, player_id, set_id)
- **parallels**: Card variants (id, name, print_run, card_id)
- **collections**: User collections (id, name, description, user_id)
- **card_records**: Inventory records (id, collection_id, card_id, parallel_id, purchase_date, purchase_price, sale_date, sale_price, sku, notes)

## Technology Stack

- **Framework**: FastAPI 0.104+
- **Database**: MySQL 8.0+
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Authentication**: JWT with python-jose
- **Password Hashing**: passlib with bcrypt
- **Testing**: pytest with httpx
- **Code Quality**: black, isort, flake8, mypy

## Environment Variables

Create `.env` file with:
```
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/card_inventory
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Current API Endpoints

### Authentication Routes (`/auth`)
- **POST /auth/register**: Create new user account
- **POST /auth/login**: Login with username/password (returns JWT token)
- **GET /auth/me**: Get current user info (requires authentication)
- **POST /auth/logout**: Logout endpoint

### General Routes
- **GET /**: Welcome message
- **GET /health**: Health check

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Development Guidelines

### Code Structure
- Use repository pattern for database operations
- Separate business logic into service layer
- Follow RESTful API conventions
- Use Pydantic schemas for request/response validation
- Implement proper error handling with custom exceptions

### Database Best Practices
- Use appropriate indexes for query performance
- Implement soft deletes where appropriate
- Use database constraints for data integrity
- Follow naming conventions (snake_case for columns)

### Security Considerations
- Always hash passwords before storing
- Implement proper JWT token validation
- Use dependency injection for authentication
- Validate all input data with Pydantic
- Implement rate limiting for API endpoints

### Testing Strategy
- Unit tests for models and services
- Integration tests for API endpoints
- Mock external dependencies
- Test both success and error scenarios
- Maintain high test coverage (>90%)

## Common Issues & Solutions

### Database Connection Issues
- Ensure MySQL service is running
- Check database credentials in .env
- Verify database exists and user has proper permissions

### Migration Issues  
- Always backup database before migrations
- Review auto-generated migrations before applying
- Use descriptive migration messages

### Authentication Issues
- Ensure SECRET_KEY is properly set
- Check token expiration times
- Validate JWT token format and claims

### Aiven MySQL Connection Issues
- Use `mysql+pymysql://` scheme (not `mysql://`)
- Remove SSL parameters from DATABASE_URL if causing connection errors
- Ensure database name and credentials are correct in .env

## Architecture Notes

### Current Authentication Flow
1. **Registration**: Username/email validation → Password hashing → User creation
2. **Login**: Credential validation → JWT token generation (30min expiry)
3. **Protected Routes**: OAuth2PasswordBearer → Token validation → User lookup
4. **Dependencies**: `get_current_user` → `get_current_active_user`

### Project Structure Pattern
- **models/**: SQLAlchemy ORM models
- **schemas/**: Pydantic request/response models  
- **services/**: Business logic and database operations
- **routers/**: FastAPI route handlers
- **utils/**: Shared utilities (security, helpers)

### Configuration Management
- Pydantic Settings with `.env` file loading
- `extra = "ignore"` allows additional environment variables
- Database URL constructed for PyMySQL + MySQL

## Development Roadmap

### Phase 1: Core Card Models (Next)
- Implement Brand, Set, Card, Player, Team models
- Create corresponding Pydantic schemas
- Add basic CRUD operations

### Phase 2: Collection Management
- User collections and card inventory tracking
- Purchase/sale history
- Custom SKU and notes system

### Phase 3: Advanced Features
- Search and filtering
- Parallel card variants
- Data import/export
>>>>>>> 926dad0 (init)
