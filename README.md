<<<<<<< HEAD
# Sports Card Inventory Manager

A comprehensive React-based web application for managing sports card collections with support for desktop and mobile devices. Track your card inventory across different sports, brands, and sets with detailed collection management features.

## Overview

This application allows users to manage their sports card collections by:
- Creating and managing multiple collections
- Tracking cards across different sports (Baseball, Basketball, Football, etc.)
- Managing brands (Topps, Bowman, Panini, etc.) and their sets
- Recording purchase/sale information and custom metadata
- Supporting parallel cards with serial numbers and print runs
=======
# Baseball Card Inventory API

A FastAPI-based backend application for managing baseball card collections and inventories.

## Overview

This application allows users to track their sports card collections across different brands, sets, and cards. Users can create multiple collections, manage their card inventory with purchase/sale tracking, and organize cards by various attributes.

## Features

- **Multi-Sport Support**: Track cards across different sports (Baseball, Basketball, Football, etc.)
- **Brand & Set Management**: Organize cards by brand (Topps, Bowman, Panini) and specific sets
- **Player & Team Database**: Comprehensive player and team information
- **Parallel Card Support**: Track special parallel cards with serial numbering
- **User Collections**: Multiple collections per user with custom organization
- **Inventory Tracking**: Purchase/sale history, pricing, and custom metadata
- **Custom SKU System**: User-defined SKU numbers for easy searching
>>>>>>> 926dad0 (init)

## Data Structure

### Core Entities

<<<<<<< HEAD
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
=======
- **Brand**: Card manufacturers (Topps, Bowman, Panini, etc.)
- **Set**: Specific card releases with name, year, and sport
- **Card**: Individual cards with player/team and card number
- **Player**: Player information with team affiliation
- **Team**: Team information across different sports
- **Parallel**: Special card variants with print run limits
- **User**: Application users with authentication
- **Collection**: User-created card collections
- **CardRecord**: User inventory records with transaction history

### Relationships

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

## Technology Stack

- **Framework**: FastAPI
- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Validation**: Pydantic
- **Authentication**: JWT tokens
>>>>>>> 926dad0 (init)

## Project Structure

```
<<<<<<< HEAD
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
=======
card-inventory-python/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection and session
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── brand.py
│   │   ├── set.py
│   │   ├── card.py
│   │   ├── player.py
│   │   ├── team.py
│   │   ├── parallel.py
│   │   ├── user.py
│   │   ├── collection.py
│   │   └── card_record.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── brand.py
│   │   ├── set.py
│   │   ├── card.py
│   │   ├── player.py
│   │   ├── team.py
│   │   ├── parallel.py
│   │   ├── user.py
│   │   ├── collection.py
│   │   └── card_record.py
│   ├── routers/                # API route handlers
│   │   ├── __init__.py
│   │   ├── brands.py
│   │   ├── sets.py
│   │   ├── cards.py
│   │   ├── players.py
│   │   ├── teams.py
│   │   ├── users.py
│   │   ├── collections.py
│   │   └── card_records.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── card_service.py
│   │   └── collection_service.py
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       └── security.py
├── alembic/                    # Database migrations
│   ├── versions/
│   └── alembic.ini
├── tests/                      # Test files
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_routers.py
│   └── test_services.py
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── docker-compose.yml         # Docker setup for development
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- MySQL 8.0+
- pip or poetry for dependency management

### Installation

1. Clone the repository
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment: `source venv/bin/activate` (Unix) or `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and configure database settings
6. Run migrations: `alembic upgrade head`
7. Start the application: `uvicorn app.main:app --reload`

### Development

- **Run tests**: `pytest`
- **Create migration**: `alembic revision --autogenerate -m "description"`
- **Apply migrations**: `alembic upgrade head`
- **Start dev server**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## API Documentation

Once the application is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **Alternative API docs**: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

[Add your chosen license here]
>>>>>>> 926dad0 (init)
