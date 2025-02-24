from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json
import random
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from telegram import InlineKeyboardMarkup, InlineKeyboardButton

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Musky Mini App Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./musky.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create tables
Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Constants
ADMIN_ID = int(os.getenv("ADMIN_ID"))
BASIC_DAILY_MUSKY = 2000
TAP_REWARD = 1
MAX_TAPS = 1000
TAP_COOLDOWN_HOURS = 4
MUSKY_TO_SOLANA_RATE = 0.000002  # 10000 MUSKY = 0.02 SOL
MIN_CONVERSION_AMOUNT = 10000
SPIN_ENERGY_COST = 10  # Assuming a default value, actual implementation needed

# Pydantic models
class UserSchema(BaseModel):
    user_id: int
    username: Optional[str] = None
    referral_count: int = 0
    balance: int = 0
    solana_balance: float = 0
    solana_address: Optional[str] = None
    verification_complete: bool = False
    energy: int = 100
    last_tap_time: Optional[datetime] = None
    last_energy_reset: Optional[datetime] = None
    mining_rate: float = 0
    level: str = "basic"

class MiningUpdate(BaseModel):
    user_id: int
    amount: int
    timestamp: Optional[datetime] = None

class ReferralUpdate(BaseModel):
    referrer_id: int
    referred_id: int

class SolanaAddressUpdate(BaseModel):
    user_id: int
    solana_address: str

class Task(BaseModel):
    id: Optional[int]
    title: str
    description: str
    type: str
    reward: int
    link: str
    image_url: str
    status: str = "active"

class SpinResult(BaseModel):
    user_id: int
    prize_type: str
    amount: float
    timestamp: datetime

class EnergyPurchase(BaseModel):
    user_id: int
    payment_type: str  # 'TON' or 'Stars'
    amount: int

class BroadcastMessage(BaseModel):
    admin_id: int
    message: str
    inline_markup: Optional[Dict] = None

# SQLAlchemy Models
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    username = Column(String)
    referral_count = Column(Integer, default=0)
    balance = Column(Integer, default=0)
    solana_balance = Column(Float, default=0)
    solana_address = Column(String)
    verification_complete = Column(Boolean, default=False)
    energy = Column(Integer, default=100)
    last_tap_time = Column(DateTime)
    last_energy_reset = Column(DateTime)
    mining_rate = Column(Float, default=0)
    level = Column(String, default='basic')
    joined_at = Column(DateTime, default=datetime.utcnow)

class SpinHistory(Base):
    __tablename__ = "spin_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    prize_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

# API endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to Musky Mini App Backend"}

@app.post("/users", response_model=UserSchema)
async def create_user(user: UserSchema):
    try:
        response = supabase.table("users").insert({
            "user_id": user.user_id,
            "username": user.username,
            "referral_count": user.referral_count,
            "balance": user.balance,
            "solana_address": user.solana_address,
            "verification_complete": user.verification_complete
        }).execute()
        
        if len(response.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/{user_id}", response_model=UserSchema)
async def get_user(user_id: int):
    try:
        response = supabase.table("users").select("*").eq("user_id", user_id).execute()
        
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mining/update")
async def update_mining_balance(update: MiningUpdate):
    try:
        # Get current user data
        user_response = supabase.table("users").select("*").eq("user_id", update.user_id).execute()
        
        if len(user_response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_balance = user_response.data[0]["balance"]
        new_balance = current_balance + update.amount
        
        # Update balance
        response = supabase.table("users").update({
            "balance": new_balance
        }).eq("user_id", update.user_id).execute()
        
        return {"success": True, "new_balance": new_balance}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/referral")
async def process_referral(referral: ReferralUpdate):
    try:
        # Check if referrer exists
        referrer_response = supabase.table("users").select("*").eq("user_id", referral.referrer_id).execute()
        
        if len(referrer_response.data) == 0:
            raise HTTPException(status_code=404, detail="Referrer not found")
        
        # Update referrer's referral count
        current_count = referrer_response.data[0]["referral_count"]
        response = supabase.table("users").update({
            "referral_count": current_count + 1
        }).eq("user_id", referral.referrer_id).execute()
        
        return {"success": True, "new_referral_count": current_count + 1}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/solana-address")
async def update_solana_address(update: SolanaAddressUpdate):
    try:
        response = supabase.table("users").update({
            "solana_address": update.solana_address,
            "verification_complete": True
        }).eq("user_id", update.user_id).execute()
        
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "solana_address": update.solana_address}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/leaderboard", response_model=List[UserSchema])
async def get_leaderboard():
    try:
        response = supabase.table("users").select("*").order("balance", desc=True).limit(10).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/tasks/admin/create")
async def create_task(task: Task, admin_id: int):
    if admin_id != ADMIN_ID:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        response = supabase.table("tasks").insert(task.dict()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/active")
async def get_active_tasks():
    try:
        response = supabase.table("tasks").select("*").eq("status", "active").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mining/tap")
async def process_tap(user_id: int):
    try:
        user = get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        now = datetime.now()
        last_tap = user.get('last_tap_time')
        if last_tap:
            last_tap = datetime.fromisoformat(last_tap)
            if (now - last_tap).total_seconds() < TAP_COOLDOWN_HOURS * 3600:
                raise HTTPException(status_code=400, detail="Tap cooldown not finished")

        if user['energy'] <= 0:
            raise HTTPException(status_code=400, detail="No energy left")

        new_balance = user['balance'] + TAP_REWARD
        new_energy = user['energy'] - 1

        supabase.table("users").update({
            'balance': new_balance,
            'energy': new_energy,
            'last_tap_time': now.isoformat()
        }).eq('user_id', user_id).execute()

        return {"success": True, "new_balance": new_balance, "new_energy": new_energy}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/convert/musky-to-solana")
async def convert_musky_to_solana(user_id: int, amount: int):
    if amount < MIN_CONVERSION_AMOUNT:
        raise HTTPException(status_code=400, detail=f"Minimum conversion amount is {MIN_CONVERSION_AMOUNT} MUSKY")

    try:
        user = get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user['balance'] < amount:
            raise HTTPException(status_code=400, detail="Insufficient MUSKY balance")

        solana_amount = amount * MUSKY_TO_SOLANA_RATE
        new_musky_balance = user['balance'] - amount
        new_solana_balance = user['solana_balance'] + solana_amount

        supabase.table("users").update({
            'balance': new_musky_balance,
            'solana_balance': new_solana_balance
        }).eq('user_id', user_id).execute()

        return {
            "success": True,
            "new_musky_balance": new_musky_balance,
            "new_solana_balance": new_solana_balance
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/energy/purchase")
async def purchase_energy(purchase: EnergyPurchase):
    try:
        user = get_user(purchase.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Process payment (implement actual payment logic)
        # For now, just update energy
        new_energy = min(100, user['energy'] + purchase.amount)
        
        supabase.table("users").update({
            'energy': new_energy,
            'last_energy_reset': datetime.now().isoformat()
        }).eq('user_id', purchase.user_id).execute()

        return {"success": True, "new_energy": new_energy}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/spin")
async def process_spin(
    user_id: str,
    db: Session = Depends(get_db)
):
    # Get user data
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.energy < 10:
            raise HTTPException(status_code=400, detail="Not enough energy")
            
        # Define prize probabilities
        prizes = [
            {"type": "SOL", "amount": 1.0, "probability": 0.001},
            {"type": "SOL", "amount": 0.5, "probability": 0.005},
            {"type": "MUSKY", "amount": 5000, "probability": 0.01},
            {"type": "MUSKY", "amount": 2000, "probability": 0.03},
            {"type": "MUSKY", "amount": 1000, "probability": 0.05},
            {"type": "ENERGY", "amount": 50, "probability": 0.1}
        ]
        
        # Random number between 0 and 1
        roll = random.random()
        
        # Determine prize
        cumulative_prob = 0
        selected_prize = None
        
        for prize in prizes:
            cumulative_prob += prize["probability"]
            if roll <= cumulative_prob:
                selected_prize = prize
                break
                
        if not selected_prize:
            selected_prize = {"type": "MUSKY", "amount": 100}  # Consolation prize
            
        # Update user balance based on prize
        if selected_prize["type"] == "SOL":
            user.solana_balance += selected_prize["amount"]
        elif selected_prize["type"] == "MUSKY":
            user.balance += selected_prize["amount"]
        else:  # ENERGY
            user.energy += selected_prize["amount"]
            
        # Deduct energy cost
        user.energy -= 10
        
        # Record spin in history
        spin_record = SpinHistory(
            user_id=user_id,
            prize_type=selected_prize["type"],
            amount=selected_prize["amount"]
        )
        db.add(spin_record)
        
        # Commit changes
        db.commit()
        
        return {
            "prize_type": selected_prize["type"],
            "amount": selected_prize["amount"]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/referrals/{user_id}")
async def get_referral_info(user_id: int):
    try:
        # Get user's referrals
        response = supabase.table("referrals").select("*").eq("referrer_id", user_id).execute()
        referrals = response.data

        # Get detailed info for each referred user
        detailed_referrals = []
        for ref in referrals:
            referred_user = get_user(ref['referred_id'])
            if referred_user:
                detailed_referrals.append({
                    "user_id": referred_user['user_id'],
                    "username": referred_user['username'],
                    "mining_rate": referred_user['mining_rate'],
                    "joined_at": ref['created_at']
                })

        return detailed_referrals
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/admin/broadcast")
async def broadcast_message(message: BroadcastMessage):
    """Send a broadcast message to all users."""
    if str(message.admin_id) != os.getenv('ADMIN_ID'):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        # Get all users
        users = db.query(User).all()
        
        # Send message to each user
        for user in users:
            try:
                # If inline markup is provided, format it
                markup = None
                if message.inline_markup:
                    markup = InlineKeyboardMarkup(
                        [[InlineKeyboardButton(text=btn['text'], url=btn['url'])] 
                         for btn in message.inline_markup.get('buttons', [])]
                    )
                
                await bot.send_message(
                    chat_id=user.user_id,
                    text=message.message,
                    reply_markup=markup,
                    parse_mode='HTML'
                )
            except Exception as e:
                print(f"Failed to send message to user {user.user_id}: {str(e)}")
                continue
                
        return {"status": "success", "message": f"Broadcast sent to {len(users)} users"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 