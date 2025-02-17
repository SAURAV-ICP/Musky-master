import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials in .env file")

supabase: Client = create_client(supabase_url, supabase_key)

def check_data():
    try:
        # Get total count
        count_result = supabase.table('users').select('*', count='exact').execute()
        total_users = count_result.count

        # Get sample of users
        users_result = supabase.table('users').select('*').limit(5).execute()
        users = users_result.data

        print(f"\nTotal users in Supabase: {total_users}")
        print("\nSample of users (first 5):")
        print("-" * 80)
        
        for user in users:
            print(f"User ID: {user['user_id']}")
            print(f"Username: {user['username']}")
            print(f"Balance: {user['balance']}")
            print(f"Referral Count: {user['referral_count']}")
            print(f"Verification Status: {user['verification_complete']}")
            print("-" * 80)

    except Exception as e:
        print(f"Error checking Supabase data: {str(e)}")

if __name__ == "__main__":
    check_data() 