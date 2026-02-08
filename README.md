# Football Betting Game

A full-stack application for football predictions and betting.

## Prerequisites

Before running the application, ensure you have the following installed:

1.  **Python 3.10+** (for the backend)
2.  **Node.js 18+** (for the frontend)
3.  **MongoDB** (database)
    - **Installation (macOS)**:
      ```bash
      # Install MongoDB via Homebrew
      brew tap mongodb/brew
      brew install mongodb-community@8.0
      ```
    - **Auto-start MongoDB** (recommended):
      ```bash
      # Start MongoDB now and restart at login automatically
      brew services start mongodb/brew/mongodb-community@8.0
      ```
    - **Manual start** (alternative):
      ```bash
      # Start MongoDB manually (won't auto-restart)
      mongod --config /opt/homebrew/etc/mongod.conf
      ```
    - **Verify MongoDB is running**:
      ```bash
      # Check if MongoDB process is running
      pgrep -l mongod
      # Should output something like: 12345 mongod
      ```

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

### MongoDB Issues

- **"Can't create account" or "Can't login"**:
  - **Cause**: MongoDB is not running
  - **Solution**: Start MongoDB with `brew services start mongodb/brew/mongodb-community@8.0`
  - **Verify**: Run `pgrep -l mongod` to check if MongoDB is running

- **MongoDB Connection Refused Error**:
  - Ensure MongoDB is running: `brew services list | grep mongodb`
  - If stopped, start it: `brew services start mongodb/brew/mongodb-community@8.0`
  - Check MongoDB logs: `tail -f /opt/homebrew/var/log/mongodb/mongo.log`

- **Port 27017 Already in Use**:
  - Another MongoDB instance might be running
  - Stop all instances: `brew services stop mongodb/brew/mongodb-community@8.0`
  - Then restart: `brew services start mongodb/brew/mongodb-community@8.0`

### Other Issues

- **Backend crashes on startup**: Check that all environment variables are set in `backend/.env`
- **Dependency Conflicts**: If `npm install` fails, try `npm install --legacy-peer-deps`
- **Port 8000 or 3000 already in use**: Kill the process using the port:
  ```bash
  # For port 8000 (backend)
  lsof -ti:8000 | xargs kill
  # For port 3000 (frontend)
  lsof -ti:3000 | xargs kill
  ```

## Features

- 🏆 **World Cup Predictions**: Predict match scores and earn points
- 📊 **Live Leaderboards**: Compete with friends and see global rankings
- 👥 **Private Groups**: Create or join groups with custom invite codes
- 🎯 **Joker System**: Double your points on one match per round
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔐 **Secure Authentication**: JWT-based user authentication

## Tech Stack

**Frontend:**

- React 18
- React Router
- Axios
- Tailwind CSS
- Lucide Icons
- Sonner (Toast notifications)

**Backend:**

- FastAPI (Python)
- Motor (Async MongoDB driver)
- PyJWT (Authentication)
- Bcrypt (Password hashing)
- Uvicorn (ASGI server)

**Database:**

- MongoDB 8.0
