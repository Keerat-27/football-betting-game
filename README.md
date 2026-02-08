# Football Betting Game

A full-stack application for football predictions and betting.

## Prerequisites

Before running the application, ensure you have the following installed:

1.  **Python 3.10+** (for the backend)
2.  **Node.js 18+** (for the frontend)
3.  **MongoDB** (database)
    - Make sure MongoDB Community Server is installed and running locally on port `27017`.
    - Start it with: `mongod` (if not running as a service)

## Installation & Setup

### 1. Backend Setup

Navigate to the project root and install the python dependencies:

```bash
# Install dependencies
python3 -m pip install -r backend/requirements_minimal.txt
```

Create a `.env` file in the `backend/` directory (if not already present):

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=football_game
JWT_SECRET=your_jwt_secret_key
FOOTBALL_DATA_API_KEY=your_api_key_optional
CORS_ORIGINS=http://localhost:3000
```

### 2. Frontend Setup

Navigate to the frontend directory and install the node modules:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (if not already present):

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Running the Application

You will need to run the **Backend** and **Frontend** in two separate terminal windows.

### Terminal 1: Backend (API Server)

From the project root:

```bash
cd backend
python3 -m uvicorn server:app --reload --port 8000
```

This will start the API server at `http://localhost:8000`. You should see `Uvicorn running on http://127.0.0.1:8000`.

### Terminal 2: Frontend (React App)

From the project root:

```bash
cd frontend
npm start
```

This will start the development server at `http://localhost:3000`.

## Troubleshooting

- **MongoDB Connection Error**: If the backend crashes with a connection refused error, ensure MongoDB is running (`mongod`).
- **Dependency Conflicts**: If `npm install` fails, try `npm install --legacy-peer-deps`.
