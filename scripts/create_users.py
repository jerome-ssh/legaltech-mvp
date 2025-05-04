import bcrypt
from supabase import create_client, Client
import sys

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_users():
    """Create sample users with hashed passwords."""
    # Initialize Supabase client with hardcoded credentials
    supabase_url = "https://ueqzjuclosoedybixqgs.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcXpqdWNsb3NvZWR5Yml4cWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzc3NDYsImV4cCI6MjA2MTg1Mzc0Nn0.SvBHF3DTlObpGuzQAD_jR7ijW4wJ01GR4IU26aoCjEw"
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("Successfully connected to Supabase!")
    except Exception as e:
        print(f"Error connecting to Supabase: {str(e)}")
        sys.exit(1)
    
    users = [
        {
            "email": "john.smith@smithlaw.com",
            "password": "Password123!",
            "first_name": "John",
            "last_name": "Smith",
            "role": "lawyer",
            "phone_number": "212-555-0101",
            "avatar_url": "https://ui-avatars.com/api/?name=John+Smith&background=random"
        },
        {
            "email": "sarah.jones@smithlaw.com",
            "password": "Password123!",
            "first_name": "Sarah",
            "last_name": "Jones",
            "role": "lawyer",
            "phone_number": "212-555-0102",
            "avatar_url": "https://ui-avatars.com/api/?name=Sarah+Jones&background=random"
        },
        {
            "email": "mike.wilson@smithlaw.com",
            "password": "Password123!",
            "first_name": "Mike",
            "last_name": "Wilson",
            "role": "paralegal",
            "phone_number": "212-555-0103",
            "avatar_url": "https://ui-avatars.com/api/?name=Mike+Wilson&background=random"
        },
        {
            "email": "client1@example.com",
            "password": "Password123!",
            "first_name": "Robert",
            "last_name": "Johnson",
            "role": "client",
            "phone_number": "212-555-0104",
            "avatar_url": "https://ui-avatars.com/api/?name=Robert+Johnson&background=random"
        }
    ]

    for user in users:
        try:
            # Hash the password
            hashed_password = hash_password(user["password"])
            
            # Insert user into Supabase
            data = {
                "email": user["email"],
                "encrypted_password": hashed_password,
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "role": user["role"],
                "phone_number": user["phone_number"],
                "avatar_url": user["avatar_url"]
            }
            
            result = supabase.table("users").insert(data).execute()
            print(f"Successfully created user: {user['email']}")
            
        except Exception as e:
            print(f"Error creating user {user['email']}: {str(e)}")

if __name__ == "__main__":
    create_users() 