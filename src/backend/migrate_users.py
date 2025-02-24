import csv
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def migrate_users():
    success_count = 0
    error_count = 0
    
    try:
        with open('users.csv', 'r') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                try:
                    # Convert data types
                    user_data = {
                        "user_id": int(row['user_id']),
                        "username": row['username'] if row['username'] != '' else None,
                        "referral_count": int(row['referral_count']),
                        "balance": int(row['balance']),
                        "solana_address": row['solana_address'] if row['solana_address'] != '' else None,
                        "verification_complete": row['verification_complete'].lower() == 'true'
                    }
                    
                    # Insert user into Supabase
                    response = supabase.table("users").insert(user_data).execute()
                    
                    if len(response.data) > 0:
                        success_count += 1
                        print(f"Successfully migrated user {user_data['user_id']}")
                    else:
                        error_count += 1
                        print(f"Failed to migrate user {user_data['user_id']}")
                
                except Exception as e:
                    error_count += 1
                    print(f"Error migrating user {row.get('user_id', 'unknown')}: {str(e)}")
    
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        return
    
    print("\nMigration Summary:")
    print(f"Successfully migrated: {success_count} users")
    print(f"Failed to migrate: {error_count} users")

if __name__ == "__main__":
    print("Starting user migration...")
    migrate_users()
    print("Migration completed.") 