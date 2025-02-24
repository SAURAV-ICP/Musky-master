import csv
import os
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials in .env file")

print(f"Connecting to Supabase at {supabase_url}")

# Create Supabase client
supabase = create_client(supabase_url, supabase_key)

def create_table():
    """Create the users table in Supabase if it doesn't exist."""
    try:
        # Note: Table creation is handled in Supabase dashboard
        # We'll verify if we can access the table
        result = supabase.table('users').select("count", count='exact').execute()
        print("Successfully connected to users table")
        print(f"Current row count: {result.count if hasattr(result, 'count') else 'unknown'}")
        return True
    except Exception as e:
        print(f"Error accessing users table: {str(e)}")
        print("Please create it in Supabase dashboard with the following structure:")
        print("""
        - user_id (int8, primary key)
        - username (text)
        - referral_count (int8)
        - balance (int8)
        - solana_address (text)
        - verification_complete (boolean)
        - joined_at (timestamptz)
        """)
        return False

def migrate_data():
    """Migrate data from CSV to Supabase."""
    print("Starting migration...")
    
    # First verify table access
    if not create_table():
        print("Aborting migration due to table access issues")
        return False
    
    # Read from CSV
    try:
        with open('users.csv', 'r') as f:
            reader = csv.DictReader(f)
            users = list(reader)
            print(f"Successfully read {len(users)} users from CSV")
    except FileNotFoundError:
        print("users.csv not found")
        return False
    except Exception as e:
        print(f"Error reading CSV: {str(e)}")
        return False
    
    # Convert data types
    print("Converting data types...")
    for user in users:
        try:
            user['user_id'] = int(user['user_id'])
            user['referral_count'] = int(user['referral_count'])
            user['balance'] = int(user['balance'])
            user['verification_complete'] = user['verification_complete'].lower() == 'true'
            
            # Ensure joined_at is in the correct format
            try:
                datetime.fromisoformat(user['joined_at'])
            except ValueError:
                user['joined_at'] = datetime.now().isoformat()
        except Exception as e:
            print(f"Error converting data types for user {user.get('user_id', 'unknown')}: {str(e)}")
            return False

    # Insert data into Supabase
    try:
        print("Inserting data into Supabase...")
        # Using upsert to avoid duplicate entries
        result = supabase.table('users').upsert(users).execute()
        print(f"Successfully migrated {len(users)} users to Supabase")
        return True
    except Exception as e:
        print(f"Error migrating data: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response details: {e.response.text if hasattr(e.response, 'text') else e.response}")
        return False

if __name__ == "__main__":
    migrate_data() 