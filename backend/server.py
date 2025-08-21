from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from decouple import config
import uuid
from enum import Enum

# Configuration
MONGO_URL = config("MONGO_URL", default="mongodb://localhost:27017/getfit")
JWT_SECRET_KEY = config("JWT_SECRET_KEY", default="your-super-secret-jwt-key")
JWT_ALGORITHM = config("JWT_ALGORITHM", default="HS256")
JWT_EXPIRATION_HOURS = config("JWT_EXPIRATION_HOURS", default=24, cast=int)

# FastAPI app
app = FastAPI(title="GetFit API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
client = AsyncIOMotorClient(MONGO_URL)
db = client.getfit

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Enums
class ActivityType(str, Enum):
    GYM = "gym"
    RUN = "run"
    WALK = "walk"
    YOGA = "yoga"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=2)
    age: int = Field(..., ge=13, le=120)
    gender: Gender
    fitness_goals: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    age: int
    gender: Gender
    fitness_goals: str
    current_streak: int = 0
    longest_streak: int = 0
    total_activities: int = 0
    created_at: datetime

class ActivityCreate(BaseModel):
    activity_type: ActivityType
    duration_minutes: int = Field(..., ge=1, le=1440)
    calories_burned: Optional[int] = None
    notes: Optional[str] = None

class Activity(BaseModel):
    id: str
    user_id: str
    activity_type: ActivityType
    duration_minutes: int
    calories_burned: Optional[int]
    notes: Optional[str]
    date: datetime
    created_at: datetime

class FriendRequest(BaseModel):
    username: str

class Message(BaseModel):
    from_user_id: str
    to_user_id: str
    message: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# Utility Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def calculate_streak(user_id: str) -> dict:
    """Calculate current and longest streak for a user"""
    activities = await db.activities.find(
        {"user_id": user_id}
    ).sort("date", -1).to_list(None)
    
    if not activities:
        return {"current_streak": 0, "longest_streak": 0}
    
    # Group activities by date
    activity_dates = set()
    for activity in activities:
        activity_dates.add(activity["date"].date())
    
    # Calculate current streak
    current_streak = 0
    current_date = datetime.utcnow().date()
    
    while current_date in activity_dates:
        current_streak += 1
        current_date -= timedelta(days=1)
    
    # If no activity today, check yesterday for grace period
    if current_streak == 0:
        yesterday = datetime.utcnow().date() - timedelta(days=1)
        if yesterday in activity_dates:
            current_streak = 1
            current_date = yesterday - timedelta(days=1)
            while current_date in activity_dates:
                current_streak += 1
                current_date -= timedelta(days=1)
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    sorted_dates = sorted(activity_dates, reverse=True)
    
    if sorted_dates:
        prev_date = sorted_dates[0]
        temp_streak = 1
        
        for i in range(1, len(sorted_dates)):
            current_date = sorted_dates[i]
            if (prev_date - current_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
            prev_date = current_date
        
        longest_streak = max(longest_streak, temp_streak)
    
    return {"current_streak": current_streak, "longest_streak": longest_streak}

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "age": user_data.age,
        "gender": user_data.gender,
        "fitness_goals": user_data.fitness_goals,
        "current_streak": 0,
        "longest_streak": 0,
        "total_activities": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    # Update streak info
    streak_info = await calculate_streak(current_user["_id"])
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": streak_info}
    )
    
    # Get updated user
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    return UserProfile(
        id=user["_id"],
        email=user["email"],
        name=user["name"],
        age=user["age"],
        gender=user["gender"],
        fitness_goals=user["fitness_goals"],
        current_streak=user.get("current_streak", 0),
        longest_streak=user.get("longest_streak", 0),
        total_activities=user.get("total_activities", 0),
        created_at=user["created_at"]
    )

@app.post("/api/activities", response_model=Activity)
async def log_activity(activity_data: ActivityCreate, current_user: dict = Depends(get_current_user)):
    activity_id = str(uuid.uuid4())
    
    activity_doc = {
        "_id": activity_id,
        "user_id": current_user["_id"],
        "activity_type": activity_data.activity_type,
        "duration_minutes": activity_data.duration_minutes,
        "calories_burned": activity_data.calories_burned,
        "notes": activity_data.notes,
        "date": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    await db.activities.insert_one(activity_doc)
    
    # Update user total activities
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"total_activities": 1}}
    )
    
    # Update streak
    streak_info = await calculate_streak(current_user["_id"])
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": streak_info}
    )
    
    return Activity(
        id=activity_id,
        user_id=current_user["_id"],
        activity_type=activity_data.activity_type,
        duration_minutes=activity_data.duration_minutes,
        calories_burned=activity_data.calories_burned,
        notes=activity_data.notes,
        date=activity_doc["date"],
        created_at=activity_doc["created_at"]
    )

@app.get("/api/activities", response_model=List[Activity])
async def get_activities(current_user: dict = Depends(get_current_user)):
    activities = await db.activities.find(
        {"user_id": current_user["_id"]}
    ).sort("date", -1).to_list(100)
    
    return [
        Activity(
            id=activity["_id"],
            user_id=activity["user_id"],
            activity_type=activity["activity_type"],
            duration_minutes=activity["duration_minutes"],
            calories_burned=activity.get("calories_burned"),
            notes=activity.get("notes"),
            date=activity["date"],
            created_at=activity["created_at"]
        )
        for activity in activities
    ]

@app.get("/api/streak")
async def get_streak(current_user: dict = Depends(get_current_user)):
    """Get current streak and calendar data"""
    streak_info = await calculate_streak(current_user["_id"])
    
    # Get activities for calendar (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    activities = await db.activities.find(
        {"user_id": current_user["_id"], "date": {"$gte": thirty_days_ago}}
    ).to_list(None)
    
    # Group by date
    activity_calendar = {}
    for activity in activities:
        date_str = activity["date"].date().isoformat()
        if date_str not in activity_calendar:
            activity_calendar[date_str] = []
        activity_calendar[date_str].append({
            "type": activity["activity_type"],
            "duration": activity["duration_minutes"],
            "calories": activity.get("calories_burned")
        })
    
    return {
        "current_streak": streak_info["current_streak"],
        "longest_streak": streak_info["longest_streak"],
        "activity_calendar": activity_calendar
    }

# Social Features (Basic structure for Phase 4)
@app.post("/api/friends/add")
async def add_friend(friend_request: FriendRequest, current_user: dict = Depends(get_current_user)):
    # Find user by email (using email as username for now)
    friend = await db.users.find_one({"email": friend_request.username})
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend["_id"] == current_user["_id"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if already friends
    existing_friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": current_user["_id"], "user2_id": friend["_id"]},
            {"user1_id": friend["_id"], "user2_id": current_user["_id"]}
        ]
    })
    
    if existing_friendship:
        raise HTTPException(status_code=400, detail="Already friends")
    
    # Create friendship
    friendship_id = str(uuid.uuid4())
    friendship_doc = {
        "_id": friendship_id,
        "user1_id": current_user["_id"],
        "user2_id": friend["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.friendships.insert_one(friendship_doc)
    
    return {"message": "Friend added successfully", "friend_name": friend["name"]}

@app.get("/api/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    # Get friendships
    friendships = await db.friendships.find({
        "$or": [
            {"user1_id": current_user["_id"]},
            {"user2_id": current_user["_id"]}
        ]
    }).to_list(None)
    
    friend_ids = []
    for friendship in friendships:
        if friendship["user1_id"] == current_user["_id"]:
            friend_ids.append(friendship["user2_id"])
        else:
            friend_ids.append(friendship["user1_id"])
    
    # Get friend details with streaks
    friends = []
    for friend_id in friend_ids:
        friend = await db.users.find_one({"_id": friend_id})
        if friend:
            streak_info = await calculate_streak(friend_id)
            friends.append({
                "id": friend["_id"],
                "name": friend["name"],
                "current_streak": streak_info["current_streak"],
                "longest_streak": streak_info["longest_streak"]
            })
    
    return friends

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)