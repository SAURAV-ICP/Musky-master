import os
from datetime import datetime
from typing import Dict, Optional, List
from supabase import create_client, Client
from dotenv import load_dotenv
from config import REFERRAL_BONUS

# Load environment variables
load_dotenv()

class Database:
    def __init__(self):
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in .env file")
            
        self.supabase: Client = create_client(supabase_url, supabase_key)

    def add_user(self, user_id: int, username: str) -> None:
        """Add a new user to the database if they don't exist."""
        if not self.get_user(user_id):
            data = {
                'user_id': user_id,
                'username': username,
                'referral_count': 0,
                'balance': 0,
                'solana_address': '',
                'verification_complete': False,
                'joined_at': datetime.now().isoformat()
            }
            try:
                self.supabase.table('users').insert(data).execute()
            except Exception as e:
                print(f"Error adding user: {str(e)}")

    def get_user(self, user_id: int) -> Optional[Dict]:
        """Get user data by user ID."""
        try:
            result = self.supabase.table('users').select('*').eq('user_id', user_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
        except Exception as e:
            print(f"Error getting user: {str(e)}")
        return None

    def update_user(self, user_id: int, data: Dict) -> bool:
        """Update user data."""
        try:
            self.supabase.table('users').update(data).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating user: {str(e)}")
            return False

    def add_referral(self, referrer_id: int) -> bool:
        """Add a referral and update balance."""
        user = self.get_user(referrer_id)
        if user:
            try:
                new_count = user['referral_count'] + 1
                new_balance = user['balance'] + REFERRAL_BONUS
                return self.update_user(referrer_id, {
                    'referral_count': new_count,
                    'balance': new_balance
                })
            except Exception as e:
                print(f"Error adding referral: {str(e)}")
        return False

    def get_all_users(self) -> List[Dict]:
        """Get all users from the database."""
        try:
            result = self.supabase.table('users').select('*').execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting all users: {str(e)}")
            return []

    def get_user_count(self) -> int:
        """Get total number of users."""
        try:
            result = self.supabase.table('users').select('*', count='exact').execute()
            return result.count if result.count is not None else 0
        except Exception as e:
            print(f"Error getting user count: {str(e)}")
            return 0

    def get_total_balance(self) -> int:
        """Get sum of all user balances."""
        try:
            result = self.supabase.table('users').select('balance').execute()
            return sum(user['balance'] for user in result.data) if result.data else 0
        except Exception as e:
            print(f"Error getting total balance: {str(e)}")
            return 0