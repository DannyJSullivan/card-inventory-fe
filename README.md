# Sports Card Inventory Manager

A comprehensive React-based web application for managing sports card collections with support for desktop and mobile devices. Track your card inventory across different sports, brands, and sets with detailed collection management features.

## Overview

This application allows users to manage their sports card collections by:
- Creating and managing multiple collections
- Tracking cards across different sports (Baseball, Basketball, Football, etc.)
- Managing brands (Topps, Bowman, Panini, etc.) and their sets
- Recording purchase/sale information and custom metadata
- Supporting parallel cards with serial numbers and print runs

## Data Structure

### Core Entities

**Brand** → **Set** → **Card** → **Parallel**
```
Brand (Topps, Bowman, Panini)
├── Set (2023 Topps Series 1, 2022 Bowman Chrome)
│   ├── name: string
│   ├── year: number
│   ├── sport: string
│   └── Cards[]
│       ├── cardNumber: string
│       ├── player: Player
│       └── parallels: Parallel[]
│           ├── name: string (Base, Refractor, Gold)
│           ├── serialNumber?: number
│           └── printRun?: number
```

**Player/Team**
```
Player {
  name: string
  team: Team
}

Team {
  name: string
  sport: string
}
```

**User Collections**
```
Collection {
  id: string
  name: string
  userId: string
  cardRecords: CardRecord[]
}

CardRecord {
  id: string
  cardId: string
  parallelId?: string
  status: 'owned' | 'sold' | 'wanted'
  purchaseDate?: Date
  purchasePrice?: number
  saleDate?: Date
  salePrice?: number
  customSku?: string
  notes?: string
  condition?: string
}
```

## Features

### Collection Management
- Create multiple collections per user
- Add/remove cards from collections
- Track card status (owned, sold, wanted)
- Record financial information (purchase/sale prices and dates)

### Search & Discovery
- Browse cards by brand, set, sport, or player
- Search by custom SKU numbers
- Filter by card condition, parallel type, or collection status

### Mobile-First Design
- Responsive design optimized for both desktop and mobile
- Touch-friendly interfaces for mobile card scanning
- Offline capability for field use

### Data Import/Export
- Import set data from various sources
- Export collection data for backup or analysis
- Bulk operations for managing large collections

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS or Material-UI
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router
- **Forms**: React Hook Form
- **API Layer**: React Query for data fetching
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd card-inventory-fe

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── cards/          # Card-specific components
│   ├── collections/    # Collection management components
│   └── forms/          # Form components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services and external integrations
├── stores/             # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

## API Integration

The frontend communicates with a backend API for:
- User authentication and authorization
- Card data management (brands, sets, cards, parallels)
- Collection CRUD operations
- Import/export functionality

Expected API endpoints:
- `/auth/*` - Authentication
- `/brands/*` - Brand management
- `/sets/*` - Set management  
- `/cards/*` - Card data
- `/collections/*` - User collections
- `/users/*` - User management

## Contributing

1. Follow the established code style and conventions
2. Write tests for new features
3. Ensure all tests pass before submitting PRs
4. Use conventional commit messages

## License

[License information to be added]
