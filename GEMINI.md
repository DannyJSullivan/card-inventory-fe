# GEMINI.md

## Project Overview

This is a full-stack web application for managing a sports card inventory. The frontend is built with React and TypeScript, using Vite as a build tool. The backend is a Python FastAPI application. The application allows users to manage their sports card collections, including features for tracking cards, brands, sets, and players. It also includes user authentication and authorization, with separate routes for admin users.

**Frontend:**

*   **Framework:** React with TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Routing:** React Router
*   **State Management:** Zustand
*   **Data Fetching:** TanStack Query

**Backend:**

*   **Framework:** FastAPI
*   **Database:** SQLAlchemy (database type not specified)
*   **Authentication:** JWT with OAuth2 password flow

## Building and Running

### Frontend

To build and run the frontend, you will need Node.js and npm installed.

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The frontend will be available at `http://localhost:5173`.

3.  **Build for production:**
    ```bash
    npm run build
    ```

4.  **Lint the code:**
    ```bash
    npm run lint
    ```

### Backend

To run the backend, you will need Python and pip installed.

1.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run the development server:**
    ```bash
    uvicorn app.main:app --reload
    ```

    The backend will be available at `http://localhost:8000`.

## Development Conventions

*   **Commits:** The project appears to follow conventional commit standards.
*   **Styling:** The frontend uses Tailwind CSS for styling.
*   **State Management:** The frontend uses Zustand for global state management, particularly for authentication.
*   **Data Fetching:** The frontend uses TanStack Query to manage server state.
*   **API:** The backend provides a RESTful API for the frontend to consume.
*   **Authentication:** Authentication is handled via JWTs. The frontend stores the token and sends it in the Authorization header of API requests.
*   **Routing:** The frontend uses React Router for client-side routing, with protected routes for authenticated and admin users.
