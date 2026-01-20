from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="KickPredict API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'kickpredict-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Football Data API
FOOTBALL_DATA_API_KEY = os.environ.get('FOOTBALL_DATA_API_KEY', '')
FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4"

# Security
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    username: str
    avatar: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PredictionCreate(BaseModel):
    match_id: int
    home_score: int
    away_score: int
    is_joker: bool = False

class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    match_id: int
    home_score: int
    away_score: int
    is_joker: bool = False
    points_earned: int = 0
    created_at: datetime
    updated_at: datetime

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class GroupJoin(BaseModel):
    code: str

class GroupResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    code: str
    owner_id: str
    member_count: int
    created_at: datetime

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "password": hash_password(user_data.password),
        "avatar": None,
        "total_points": 0,
        "exact_scores": 0,
        "goal_diffs": 0,
        "tendencies": 0,
        "predictions_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        username=user_data.username,
        avatar=None,
        created_at=datetime.now(timezone.utc)
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    created_at = user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        avatar=user.get("avatar"),
        created_at=created_at
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    created_at = current_user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        username=current_user["username"],
        avatar=current_user.get("avatar"),
        created_at=created_at
    )

# ==================== FOOTBALL DATA API ====================

async def fetch_football_data(endpoint: str) -> Optional[Dict]:
    if not FOOTBALL_DATA_API_KEY:
        logger.warning("Football Data API key not configured")
        return None
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{FOOTBALL_DATA_BASE_URL}{endpoint}",
                headers={"X-Auth-Token": FOOTBALL_DATA_API_KEY},
                timeout=30.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Football API error: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Football API request failed: {e}")
            return None

@api_router.get("/competitions")
async def get_competitions():
    # Return World Cup competition info
    competitions = await db.competitions.find({}, {"_id": 0}).to_list(100)
    if not competitions:
        # Initialize with World Cup
        wc = {
            "id": 2000,
            "name": "FIFA World Cup",
            "code": "WC",
            "type": "CUP",
            "emblem": "https://crests.football-data.org/qatar.png",
            "current_season": 2022,
            "stages": ["GROUP_STAGE", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"]
        }
        await db.competitions.insert_one(wc)
        competitions = [wc]
    return competitions

@api_router.get("/matches")
async def get_matches(
    competition_id: Optional[int] = 2000,
    stage: Optional[str] = None,
    group: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if competition_id:
        query["competition_id"] = competition_id
    if stage:
        query["stage"] = stage
    if group:
        query["group"] = group
    if status:
        query["status"] = status
    
    matches = await db.matches.find(query, {"_id": 0}).sort("utc_date", 1).to_list(200)
    return matches

@api_router.get("/matches/{match_id}")
async def get_match(match_id: int):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@api_router.post("/matches/sync")
async def sync_matches(current_user: dict = Depends(get_current_user)):
    """Sync matches from Football Data API"""
    data = await fetch_football_data("/competitions/WC/matches")
    if not data:
        # Use mock data if API unavailable
        return await generate_mock_matches()
    
    matches_synced = 0
    for match in data.get("matches", []):
        match_doc = {
            "id": match["id"],
            "competition_id": 2000,
            "utc_date": match["utcDate"],
            "status": match["status"],
            "matchday": match.get("matchday", 1),
            "stage": match.get("stage", "GROUP_STAGE"),
            "group": match.get("group"),
            "home_team": {
                "id": match["homeTeam"]["id"],
                "name": match["homeTeam"]["name"],
                "short_name": match["homeTeam"].get("shortName", match["homeTeam"]["name"][:3].upper()),
                "crest": match["homeTeam"].get("crest", "")
            },
            "away_team": {
                "id": match["awayTeam"]["id"],
                "name": match["awayTeam"]["name"],
                "short_name": match["awayTeam"].get("shortName", match["awayTeam"]["name"][:3].upper()),
                "crest": match["awayTeam"].get("crest", "")
            },
            "score": {
                "home": match["score"]["fullTime"]["home"],
                "away": match["score"]["fullTime"]["away"]
            },
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        await db.matches.update_one({"id": match["id"]}, {"$set": match_doc}, upsert=True)
        matches_synced += 1
    
    return {"message": f"Synced {matches_synced} matches"}

async def generate_mock_matches():
    """Generate mock World Cup matches for demo"""
    groups = ["A", "B", "C", "D", "E", "F", "G", "H"]
    teams_per_group = {
        "A": [("Qatar", "QAT"), ("Ecuador", "ECU"), ("Senegal", "SEN"), ("Netherlands", "NED")],
        "B": [("England", "ENG"), ("Iran", "IRN"), ("USA", "USA"), ("Wales", "WAL")],
        "C": [("Argentina", "ARG"), ("Saudi Arabia", "KSA"), ("Mexico", "MEX"), ("Poland", "POL")],
        "D": [("France", "FRA"), ("Australia", "AUS"), ("Denmark", "DEN"), ("Tunisia", "TUN")],
        "E": [("Spain", "ESP"), ("Costa Rica", "CRC"), ("Germany", "GER"), ("Japan", "JPN")],
        "F": [("Belgium", "BEL"), ("Canada", "CAN"), ("Morocco", "MAR"), ("Croatia", "CRO")],
        "G": [("Brazil", "BRA"), ("Serbia", "SRB"), ("Switzerland", "SUI"), ("Cameroon", "CMR")],
        "H": [("Portugal", "POR"), ("Ghana", "GHA"), ("Uruguay", "URU"), ("South Korea", "KOR")]
    }
    
    match_id = 100000
    base_date = datetime.now(timezone.utc)
    matches_created = 0
    
    # Group stage matches
    for group_letter, teams in teams_per_group.items():
        matchday = 1
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                match_date = base_date + timedelta(days=matchday, hours=(i + j) * 3)
                match_doc = {
                    "id": match_id,
                    "competition_id": 2000,
                    "utc_date": match_date.isoformat(),
                    "status": "SCHEDULED" if match_date > datetime.now(timezone.utc) else "FINISHED",
                    "matchday": matchday,
                    "stage": "GROUP_STAGE",
                    "group": f"GROUP_{group_letter}",
                    "home_team": {
                        "id": match_id * 10,
                        "name": teams[i][0],
                        "short_name": teams[i][1],
                        "crest": f"https://flagcdn.com/w80/{teams[i][1].lower()[:2]}.png"
                    },
                    "away_team": {
                        "id": match_id * 10 + 1,
                        "name": teams[j][0],
                        "short_name": teams[j][1],
                        "crest": f"https://flagcdn.com/w80/{teams[j][1].lower()[:2]}.png"
                    },
                    "score": {"home": None, "away": None},
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
                await db.matches.update_one({"id": match_id}, {"$set": match_doc}, upsert=True)
                match_id += 1
                matches_created += 1
                matchday = (matchday % 3) + 1
    
    # Knockout matches (placeholders)
    knockout_stages = [
        ("LAST_16", 8, 20),
        ("QUARTER_FINALS", 4, 25),
        ("SEMI_FINALS", 2, 28),
        ("THIRD_PLACE", 1, 31),
        ("FINAL", 1, 31)
    ]
    
    for stage, num_matches, days_offset in knockout_stages:
        for m in range(num_matches):
            match_date = base_date + timedelta(days=days_offset + m)
            match_doc = {
                "id": match_id,
                "competition_id": 2000,
                "utc_date": match_date.isoformat(),
                "status": "SCHEDULED",
                "matchday": None,
                "stage": stage,
                "group": None,
                "home_team": {
                    "id": None,
                    "name": f"TBD (Match {match_id - 100000})",
                    "short_name": "TBD",
                    "crest": ""
                },
                "away_team": {
                    "id": None,
                    "name": f"TBD (Match {match_id - 100000 + 1})",
                    "short_name": "TBD",
                    "crest": ""
                },
                "score": {"home": None, "away": None},
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            await db.matches.update_one({"id": match_id}, {"$set": match_doc}, upsert=True)
            match_id += 1
            matches_created += 1
    
    return {"message": f"Generated {matches_created} mock matches"}

@api_router.get("/standings")
async def get_standings(competition_id: int = 2000):
    standings = await db.standings.find({"competition_id": competition_id}, {"_id": 0}).to_list(100)
    if not standings:
        # Generate from matches
        standings = await calculate_standings()
    return standings

async def calculate_standings():
    """Calculate group standings from matches"""
    matches = await db.matches.find({"stage": "GROUP_STAGE", "status": "FINISHED"}, {"_id": 0}).to_list(200)
    
    standings_data = {}
    for match in matches:
        group = match.get("group", "").replace("GROUP_", "")
        if not group:
            continue
        
        if group not in standings_data:
            standings_data[group] = {}
        
        home = match["home_team"]["name"]
        away = match["away_team"]["name"]
        home_score = match["score"].get("home", 0) or 0
        away_score = match["score"].get("away", 0) or 0
        
        for team, gf, ga, is_home in [(home, home_score, away_score, True), (away, away_score, home_score, False)]:
            if team not in standings_data[group]:
                standings_data[group][team] = {
                    "team": team,
                    "played": 0, "won": 0, "drawn": 0, "lost": 0,
                    "goals_for": 0, "goals_against": 0, "goal_diff": 0, "points": 0
                }
            
            standings_data[group][team]["played"] += 1
            standings_data[group][team]["goals_for"] += gf
            standings_data[group][team]["goals_against"] += ga
            standings_data[group][team]["goal_diff"] = standings_data[group][team]["goals_for"] - standings_data[group][team]["goals_against"]
            
            if gf > ga:
                standings_data[group][team]["won"] += 1
                standings_data[group][team]["points"] += 3
            elif gf == ga:
                standings_data[group][team]["drawn"] += 1
                standings_data[group][team]["points"] += 1
            else:
                standings_data[group][team]["lost"] += 1
    
    result = []
    for group, teams in standings_data.items():
        sorted_teams = sorted(teams.values(), key=lambda x: (-x["points"], -x["goal_diff"], -x["goals_for"]))
        result.append({
            "group": group,
            "competition_id": 2000,
            "table": sorted_teams
        })
    
    return result

# ==================== PREDICTIONS ====================

@api_router.post("/predictions", response_model=PredictionResponse)
async def create_prediction(prediction: PredictionCreate, current_user: dict = Depends(get_current_user)):
    # Check if match exists and is open for predictions
    match = await db.matches.find_one({"id": prediction.match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Check lock time (15 minutes before kickoff)
    match_date = datetime.fromisoformat(match["utc_date"].replace('Z', '+00:00'))
    lock_time = match_date - timedelta(minutes=15)
    
    if datetime.now(timezone.utc) >= lock_time:
        raise HTTPException(status_code=400, detail="Predictions are locked for this match")
    
    prediction_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    prediction_doc = {
        "id": prediction_id,
        "user_id": current_user["id"],
        "match_id": prediction.match_id,
        "home_score": prediction.home_score,
        "away_score": prediction.away_score,
        "is_joker": prediction.is_joker,
        "points_earned": 0,
        "created_at": now,
        "updated_at": now
    }
    
    # Upsert prediction (one per user per match)
    await db.predictions.update_one(
        {"user_id": current_user["id"], "match_id": prediction.match_id},
        {"$set": prediction_doc},
        upsert=True
    )
    
    return PredictionResponse(
        id=prediction_id,
        user_id=current_user["id"],
        match_id=prediction.match_id,
        home_score=prediction.home_score,
        away_score=prediction.away_score,
        is_joker=prediction.is_joker,
        points_earned=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

@api_router.get("/predictions")
async def get_predictions(
    match_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    if match_id:
        query["match_id"] = match_id
    
    predictions = await db.predictions.find(query, {"_id": 0}).to_list(500)
    return predictions

@api_router.get("/predictions/match/{match_id}")
async def get_match_predictions(match_id: int, current_user: dict = Depends(get_current_user)):
    """Get all predictions for a match (only revealed after lock)"""
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match_date = datetime.fromisoformat(match["utc_date"].replace('Z', '+00:00'))
    lock_time = match_date - timedelta(minutes=15)
    
    if datetime.now(timezone.utc) < lock_time:
        # Only return current user's prediction before lock
        prediction = await db.predictions.find_one(
            {"match_id": match_id, "user_id": current_user["id"]},
            {"_id": 0}
        )
        return [prediction] if prediction else []
    
    # After lock, return all predictions
    predictions = await db.predictions.find({"match_id": match_id}, {"_id": 0}).to_list(1000)
    
    # Add usernames
    for pred in predictions:
        user = await db.users.find_one({"id": pred["user_id"]}, {"_id": 0, "username": 1})
        pred["username"] = user.get("username", "Unknown") if user else "Unknown"
    
    return predictions

# ==================== LEADERBOARDS ====================

@api_router.get("/leaderboards")
async def get_leaderboard(
    group_id: Optional[str] = None,
    limit: int = 50
):
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "total_points": {"$sum": "$points_earned"},
            "predictions_count": {"$sum": 1},
            "exact_scores": {"$sum": {"$cond": [{"$eq": ["$points_earned", 4]}, 1, 0]}},
            "goal_diffs": {"$sum": {"$cond": [{"$eq": ["$points_earned", 3]}, 1, 0]}},
            "tendencies": {"$sum": {"$cond": [{"$eq": ["$points_earned", 2]}, 1, 0]}}
        }},
        {"$sort": {"total_points": -1}},
        {"$limit": limit}
    ]
    
    leaderboard = await db.predictions.aggregate(pipeline).to_list(limit)
    
    # Enrich with user data
    result = []
    for idx, entry in enumerate(leaderboard):
        user = await db.users.find_one({"id": entry["_id"]}, {"_id": 0, "username": 1, "avatar": 1})
        result.append({
            "rank": idx + 1,
            "user_id": entry["_id"],
            "username": user.get("username", "Unknown") if user else "Unknown",
            "avatar": user.get("avatar") if user else None,
            "total_points": entry["total_points"],
            "predictions_count": entry["predictions_count"],
            "exact_scores": entry["exact_scores"],
            "goal_diffs": entry["goal_diffs"],
            "tendencies": entry["tendencies"],
            "movement": 0  # Would compare with previous snapshot
        })
    
    return result

@api_router.get("/leaderboards/group/{group_id}")
async def get_group_leaderboard(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check membership
    is_member = current_user["id"] in group.get("members", [])
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    member_ids = group.get("members", [])
    
    pipeline = [
        {"$match": {"user_id": {"$in": member_ids}}},
        {"$group": {
            "_id": "$user_id",
            "total_points": {"$sum": "$points_earned"},
            "predictions_count": {"$sum": 1}
        }},
        {"$sort": {"total_points": -1}}
    ]
    
    leaderboard = await db.predictions.aggregate(pipeline).to_list(100)
    
    result = []
    for idx, entry in enumerate(leaderboard):
        user = await db.users.find_one({"id": entry["_id"]}, {"_id": 0, "username": 1, "avatar": 1})
        result.append({
            "rank": idx + 1,
            "user_id": entry["_id"],
            "username": user.get("username", "Unknown") if user else "Unknown",
            "avatar": user.get("avatar") if user else None,
            "total_points": entry["total_points"],
            "predictions_count": entry["predictions_count"],
            "movement": 0
        })
    
    return result

# ==================== GROUPS ====================

@api_router.post("/groups", response_model=GroupResponse)
async def create_group(group_data: GroupCreate, current_user: dict = Depends(get_current_user)):
    group_id = str(uuid.uuid4())
    code = str(uuid.uuid4())[:8].upper()
    
    group = {
        "id": group_id,
        "name": group_data.name,
        "description": group_data.description or "",
        "code": code,
        "owner_id": current_user["id"],
        "members": [current_user["id"]],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.groups.insert_one(group)
    
    return GroupResponse(
        id=group_id,
        name=group_data.name,
        description=group_data.description or "",
        code=code,
        owner_id=current_user["id"],
        member_count=1,
        created_at=datetime.now(timezone.utc)
    )

@api_router.post("/groups/join", response_model=GroupResponse)
async def join_group(join_data: GroupJoin, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"code": join_data.code.upper()})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user["id"] in group.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")
    
    await db.groups.update_one(
        {"id": group["id"]},
        {"$addToSet": {"members": current_user["id"]}}
    )
    
    created_at = group["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    
    return GroupResponse(
        id=group["id"],
        name=group["name"],
        description=group.get("description", ""),
        code=group["code"],
        owner_id=group["owner_id"],
        member_count=len(group.get("members", [])) + 1,
        created_at=created_at
    )

@api_router.get("/groups")
async def get_my_groups(current_user: dict = Depends(get_current_user)):
    groups = await db.groups.find(
        {"members": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    for group in groups:
        group["member_count"] = len(group.get("members", []))
    
    return groups

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user["id"] not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member")
    
    # Get member details
    members = []
    for member_id in group.get("members", []):
        user = await db.users.find_one({"id": member_id}, {"_id": 0, "id": 1, "username": 1, "avatar": 1})
        if user:
            members.append(user)
    
    group["members_details"] = members
    group["member_count"] = len(members)
    
    return group

# ==================== USER PROFILE ====================

@api_router.get("/users/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    # Get user stats
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": None,
            "total_points": {"$sum": "$points_earned"},
            "predictions_count": {"$sum": 1},
            "exact_scores": {"$sum": {"$cond": [{"$eq": ["$points_earned", 4]}, 1, 0]}},
            "goal_diffs": {"$sum": {"$cond": [{"$eq": ["$points_earned", 3]}, 1, 0]}},
            "tendencies": {"$sum": {"$cond": [{"$eq": ["$points_earned", 2]}, 1, 0]}}
        }}
    ]
    
    stats_result = await db.predictions.aggregate(pipeline).to_list(1)
    stats = stats_result[0] if stats_result else {
        "total_points": 0,
        "predictions_count": 0,
        "exact_scores": 0,
        "goal_diffs": 0,
        "tendencies": 0
    }
    
    # Get global rank
    all_users_pipeline = [
        {"$group": {"_id": "$user_id", "total_points": {"$sum": "$points_earned"}}},
        {"$sort": {"total_points": -1}}
    ]
    all_rankings = await db.predictions.aggregate(all_users_pipeline).to_list(10000)
    
    global_rank = 1
    for idx, user in enumerate(all_rankings):
        if user["_id"] == current_user["id"]:
            global_rank = idx + 1
            break
    
    # Get groups count
    groups_count = await db.groups.count_documents({"members": current_user["id"]})
    
    return {
        "user": current_user,
        "stats": {
            "total_points": stats.get("total_points", 0),
            "predictions_count": stats.get("predictions_count", 0),
            "exact_scores": stats.get("exact_scores", 0),
            "goal_diffs": stats.get("goal_diffs", 0),
            "tendencies": stats.get("tendencies", 0),
            "global_rank": global_rank,
            "groups_count": groups_count,
            "accuracy": round(
                (stats.get("exact_scores", 0) + stats.get("goal_diffs", 0) + stats.get("tendencies", 0)) 
                / max(stats.get("predictions_count", 1), 1) * 100, 1
            )
        }
    }

# ==================== WEBSOCKET ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, competition_id: str):
        await websocket.accept()
        if competition_id not in self.active_connections:
            self.active_connections[competition_id] = []
        self.active_connections[competition_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, competition_id: str):
        if competition_id in self.active_connections:
            if websocket in self.active_connections[competition_id]:
                self.active_connections[competition_id].remove(websocket)
    
    async def broadcast(self, competition_id: str, message: dict):
        if competition_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[competition_id]:
                try:
                    await connection.send_json(message)
                except:
                    dead_connections.append(connection)
            for dc in dead_connections:
                self.disconnect(dc, competition_id)

ws_manager = ConnectionManager()

@api_router.websocket("/ws/matches/{competition_id}")
async def websocket_endpoint(websocket: WebSocket, competition_id: str):
    await ws_manager.connect(websocket, competition_id)
    try:
        # Send initial matches
        matches = await db.matches.find(
            {"competition_id": int(competition_id)},
            {"_id": 0}
        ).sort("utc_date", 1).to_list(200)
        await websocket.send_json({"type": "initial", "matches": matches})
        
        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, competition_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket, competition_id)

# ==================== POINTS CALCULATION ====================

async def calculate_points(prediction: dict, match: dict) -> int:
    """Calculate points for a prediction"""
    if match["status"] != "FINISHED":
        return 0
    
    pred_home = prediction["home_score"]
    pred_away = prediction["away_score"]
    actual_home = match["score"].get("home", 0) or 0
    actual_away = match["score"].get("away", 0) or 0
    
    # Exact score = 4 points
    if pred_home == actual_home and pred_away == actual_away:
        return 4
    
    # Correct goal difference = 3 points
    pred_diff = pred_home - pred_away
    actual_diff = actual_home - actual_away
    if pred_diff == actual_diff:
        return 3
    
    # Correct tendency = 2 points
    def get_tendency(home, away):
        if home > away:
            return "H"
        elif home < away:
            return "A"
        return "D"
    
    if get_tendency(pred_home, pred_away) == get_tendency(actual_home, actual_away):
        return 2
    
    return 0

@api_router.post("/matches/{match_id}/finish")
async def finish_match(
    match_id: int,
    home_score: int,
    away_score: int,
    current_user: dict = Depends(get_current_user)
):
    """Admin endpoint to finish a match and calculate points"""
    # Update match
    await db.matches.update_one(
        {"id": match_id},
        {"$set": {
            "status": "FINISHED",
            "score": {"home": home_score, "away": away_score},
            "last_updated": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    
    # Calculate points for all predictions
    predictions = await db.predictions.find({"match_id": match_id}).to_list(10000)
    
    for pred in predictions:
        points = await calculate_points(pred, match)
        multiplier = 2 if pred.get("is_joker") else 1
        final_points = points * multiplier
        
        await db.predictions.update_one(
            {"id": pred["id"]},
            {"$set": {"points_earned": final_points}}
        )
    
    # Broadcast update
    await ws_manager.broadcast(str(match["competition_id"]), {
        "type": "match_finished",
        "match": match
    })
    
    return {"message": f"Match finished. {len(predictions)} predictions scored."}

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.users.create_index("id", unique=True)
    await db.matches.create_index("id", unique=True)
    await db.matches.create_index("competition_id")
    await db.matches.create_index("stage")
    await db.predictions.create_index([("user_id", 1), ("match_id", 1)], unique=True)
    await db.groups.create_index("code", unique=True)
    await db.groups.create_index("id", unique=True)
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
