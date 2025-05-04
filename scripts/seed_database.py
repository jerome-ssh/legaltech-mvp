import bcrypt
from supabase import create_client, Client
import sys
from datetime import datetime, timedelta
import re
from typing import Dict, List, Optional, Union
from decimal import Decimal
import uuid
import os
import random
from dotenv import load_dotenv
import requests
import json
from twilio.rest import Client as TwilioClient
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from msgraph.core import GraphClient
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
import os.path
from zoomus import ZoomClient

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    "https://ueqzjuclosoedybixqgs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcXpqdWNsb3NvZWR5Yml4cWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzc3NDYsImV4cCI6MjA2MTg1Mzc0Nn0.SvBHF3DTlObpGuzQAD_jR7ijW4wJ01GR4IU26aoCjEw"
)

# Initialize API clients
# Communication APIs
twilio_client = TwilioClient(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
sendgrid_client = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
slack_client = WebClient(token=os.getenv('SLACK_BOT_TOKEN'))

# Microsoft Graph API setup
graph_client = GraphClient(credential=os.getenv('MSGRAPH_ACCESS_TOKEN'))

# Azure Cognitive Services setup
text_analytics_client = TextAnalyticsClient(
    endpoint=os.getenv('AZURE_TEXT_ANALYTICS_ENDPOINT'),
    credential=AzureKeyCredential(os.getenv('AZURE_TEXT_ANALYTICS_KEY'))
)

# Google Calendar setup
SCOPES = ['https://www.googleapis.com/auth/calendar']
creds = None
if os.path.exists('token.pickle'):
    with open('token.pickle', 'rb') as token:
        creds = pickle.load(token)
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials.json', SCOPES)
        creds = flow.run_local_server(port=0)
    with open('token.pickle', 'wb') as token:
        pickle.dump(creds, token)
calendar_service = build('calendar', 'v3', credentials=creds)

# Zoom setup
zoom_client = ZoomClient(
    os.getenv('ZOOM_API_KEY'),
    os.getenv('ZOOM_API_SECRET')
)

# Constants
VALID_CASE_STATUSES = ['open', 'pending', 'closed', 'archived']
VALID_PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent']
VALID_BILLING_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
VALID_MESSAGE_TYPES = ['text', 'file', 'system', 'notification']

# Practice areas
practice_areas = [
    "Criminal Law",
    "Family Law",
    "Corporate Law",
    "Real Estate Law",
    "Immigration Law",
    "Intellectual Property"
]

# User roles
user_roles = ["lawyer", "client", "paralegal", "admin"]

# Case statuses
case_statuses = ["open", "closed"]

# Message types
message_types = ["text", "file", "system", "notification"]

# Note privacy settings
note_privacy = [True, False]

# Calendar event types
event_types = ["meeting", "court_date", "deadline", "reminder"]

# Data validation rules
def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password: str) -> bool:
    """Validate password strength."""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True

def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    # Accepts formats like: 212-555-0100, (212) 555-0100, 2125550100
    pattern = r'^(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}$'
    return bool(re.match(pattern, phone))

def validate_date(date_str: str) -> bool:
    """Validate date format (YYYY-MM-DD)."""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def validate_money(amount: Union[int, float, Decimal]) -> bool:
    """Validate money amount."""
    try:
        amount = float(amount)
        return amount >= 0
    except (ValueError, TypeError):
        return False

def validate_zip_code(zip_code: str) -> bool:
    """Validate US zip code format."""
    pattern = r'^\d{5}(-\d{4})?$'
    return bool(re.match(pattern, zip_code))

def validate_case_status(status: str) -> bool:
    """Validate case status."""
    return status.lower() in VALID_CASE_STATUSES

def validate_priority_level(priority: str) -> bool:
    """Validate priority level."""
    return priority.lower() in VALID_PRIORITY_LEVELS

def validate_billing_status(status: str) -> bool:
    """Validate billing status."""
    return status.lower() in VALID_BILLING_STATUSES

def validate_message_type(msg_type: str) -> bool:
    """Validate message type."""
    return msg_type.lower() in VALID_MESSAGE_TYPES

# Database helper functions
def check_duplicate(table: str, field: str, value: str) -> bool:
    """Check if a record with the given field value already exists."""
    try:
        result = supabase.table(table).select(field).eq(field, value).execute()
        return len(result.data) > 0
    except Exception as e:
        print(f"Error checking duplicate {field} in {table}: {str(e)}")
        return False

def get_record_by_field(table: str, field: str, value: str) -> Optional[Dict]:
    """Get a record by field value."""
    try:
        result = supabase.table(table).select('*').eq(field, value).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error getting record from {table} by {field}: {str(e)}")
        return None

def check_foreign_key(table: str, id_value: str) -> bool:
    """Check if a foreign key reference exists."""
    try:
        result = supabase.table(table).select('id').eq('id', id_value).execute()
        return len(result.data) > 0
    except Exception as e:
        print(f"Error checking foreign key in {table}: {str(e)}")
        return False

def generate_case_number(practice_area: str, year: int, sequence: int) -> str:
    """Generate a unique case number."""
    return f"{practice_area[:4].upper()}-{year}-{sequence:03d}"

def generate_invoice_number() -> str:
    """Generate a unique invoice number."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    return f"INV-{timestamp}-{unique_id}"

def archive_old_records(table: str, days: int = 365) -> None:
    """Archive records older than specified days."""
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        result = supabase.table(table).update({'status': 'archived'}).lt('created_at', cutoff_date).execute()
        print(f"Archived {len(result.data)} records from {table}")
    except Exception as e:
        print(f"Error archiving records from {table}: {str(e)}")

def cleanup_archived_records(table: str, days: int = 730) -> None:
    """Delete archived records older than specified days."""
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        result = supabase.table(table).delete().eq('status', 'archived').lt('created_at', cutoff_date).execute()
        print(f"Deleted {len(result.data)} archived records from {table}")
    except Exception as e:
        print(f"Error cleaning up archived records from {table}: {str(e)}")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_tables():
    print("\nCreating tables...")
    try:
        # Create tables with correct schema
        create_tables_sql = """
        -- Create messages table
        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
            recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
            message_type TEXT NOT NULL CHECK (message_type IN ('text', 'file', 'system', 'notification')),
            content TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create notes table
        CREATE TABLE IF NOT EXISTS notes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            is_private BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create calendar_events table
        CREATE TABLE IF NOT EXISTS calendar_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            location TEXT,
            type TEXT NOT NULL CHECK (type IN ('meeting', 'court_date', 'deadline', 'reminder')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable Row Level Security
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Messages are viewable by participants" ON messages
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id FROM case_participants WHERE case_id = case_id
                )
            );

        CREATE POLICY "Participants can manage their messages" ON messages
            FOR ALL USING (
                auth.uid() = sender_id
            );

        CREATE POLICY "Notes are viewable by participants" ON notes
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id FROM case_participants WHERE case_id = case_id
                )
            );

        CREATE POLICY "Participants can manage their notes" ON notes
            FOR ALL USING (
                auth.uid() = user_id
            );

        CREATE POLICY "Calendar events are viewable by participants" ON calendar_events
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id FROM case_participants WHERE case_id = case_id
                )
            );

        CREATE POLICY "Participants can manage their calendar events" ON calendar_events
            FOR ALL USING (
                auth.uid() = user_id
            );
        """
        supabase.rpc("exec_sql", {"sql": create_tables_sql}).execute()
        print("Created all tables and policies")
    except Exception as e:
        print(f"Error creating tables: {str(e)}")
        return False
    return True

def create_law_firms_table():
    print("\nCreating law_firms table...")
    try:
        sql = """
        CREATE TABLE IF NOT EXISTS law_firms (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL UNIQUE,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            phone_number TEXT,
            email TEXT,
            website TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Enable Row Level Security
        ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Law firms are viewable by all authenticated users" ON law_firms
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Admins can manage law firms" ON law_firms
            FOR ALL USING (
                auth.uid() IN (
                    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
                )
            );
        """
        supabase.table("law_firms").select("id").limit(1).execute()
        print("Law firms table already exists")
    except Exception as e:
        print(f"Creating law firms table: {str(e)}")
        try:
            supabase.rpc("exec_sql", {"sql": sql}).execute()
            print("Created law firms table")
        except Exception as e:
            print(f"Error creating law firms table: {str(e)}")
            return False
    return True

def insert_practice_areas():
    print("\nInserting practice areas...")
    for area in practice_areas:
        try:
            supabase.table("practice_areas").insert({
                "name": area,
                "description": f"Legal services related to {area}"
            }).execute()
            print(f"Inserted practice area: {area}")
        except Exception as e:
            print(f"Practice area {area} already exists, skipping...")

def insert_law_firm():
    print("\nInserting law firm...")
    law_firm = {
        "name": "Smith & Associates LLP",
        "address": "123 Legal Street",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "phone_number": "212-555-0100",
        "email": "contact@smithlaw.com",
        "website": "https://www.smithlaw.com"
    }
    try:
        # Check if law firm exists
        result = supabase.table("law_firms").select("id").eq("name", law_firm["name"]).execute()
        if result.data:
            print(f"Law firm {law_firm['name']} already exists, using existing ID...")
            return result.data[0]["id"]
        
        # Create new law firm
        result = supabase.table("law_firms").insert(law_firm).execute()
        print(f"Created law firm: {law_firm['name']}")
        return result.data[0]["id"]
    except Exception as e:
        print(f"Error handling law firm: {str(e)}")
        return None

def insert_users():
    print("\nInserting users...")
    users = [
        {
            "email": "john.smith@smithlaw.com",
            "first_name": "John",
            "last_name": "Smith",
            "role": "lawyer",
            "phone_number": "212-555-0101",
            "password_hash": hash_password("hashed_password_1"),
            "avatar_url": f"https://ui-avatars.com/api/?name=John+Smith&background=random"
        },
        {
            "email": "sarah.jones@smithlaw.com",
            "first_name": "Sarah",
            "last_name": "Jones",
            "role": "lawyer",
            "phone_number": "212-555-0102",
            "password_hash": hash_password("hashed_password_2"),
            "avatar_url": f"https://ui-avatars.com/api/?name=Sarah+Jones&background=random"
        },
        {
            "email": "mike.wilson@smithlaw.com",
            "first_name": "Mike",
            "last_name": "Wilson",
            "role": "paralegal",
            "phone_number": "212-555-0103",
            "password_hash": hash_password("hashed_password_3"),
            "avatar_url": f"https://ui-avatars.com/api/?name=Mike+Wilson&background=random"
        },
        {
            "email": "client1@example.com",
            "first_name": "Robert",
            "last_name": "Johnson",
            "role": "client",
            "phone_number": "212-555-0104",
            "password_hash": hash_password("hashed_password_4"),
            "avatar_url": f"https://ui-avatars.com/api/?name=Robert+Johnson&background=random"
        }
    ]
    
    created_users = []
    for user in users:
        try:
            # Check if user exists
            result = supabase.table("users").select("id").eq("email", user["email"]).execute()
            if result.data:
                print(f"User {user['email']} already exists, using existing ID...")
                user["id"] = result.data[0]["id"]
                created_users.append(user)
                continue
            
            # Create new user
            result = supabase.table("users").insert(user).execute()
            user["id"] = result.data[0]["id"]
            created_users.append(user)
            print(f"Created user: {user['email']}")
        except Exception as e:
            print(f"Error creating user {user['email']}: {str(e)}")
    return created_users

def insert_cases(users):
    print("\nInserting cases...")
    cases = []
    
    # Get the Corporate Law practice area
    practice_area_result = supabase.table("practice_areas").select("id").eq("name", "Corporate Law").execute()
    if not practice_area_result.data:
        print("Error: Corporate Law practice area not found")
        return None
    
    practice_area_id = practice_area_result.data[0]["id"]
    
    # Find John Smith (the assigned lawyer)
    john_smith = next((u for u in users if u["email"] == "john.smith@smithlaw.com"), None)
    if not john_smith:
        print("Error: John Smith not found in users")
        return None
    
    # Create the Tech Corp Merger case
    case = {
        "title": "Tech Corp Merger",
        "description": "Handling merger negotiations and documentation",
        "status": "open",
        "practice_area_id": practice_area_id,
        "firm_id": firm_id,
        "assigned_to": john_smith["id"],
        "case_number": "CORP-2023-001",
        "priority": "high",
        "open_date": "2023-01-15",
        "estimated_completion_date": "2023-12-31",
        "billing_rate": 350.00,
        "created_by": john_smith["id"]  # Add created_by field
    }
    
    try:
        # First, check if the case already exists
        existing_case = supabase.table("cases").select("id").eq("case_number", "CORP-2023-001").execute()
        if existing_case.data:
            print(f"Case {case['title']} already exists, using existing ID...")
            case["id"] = existing_case.data[0]["id"]
            cases.append(case)
            return cases
        
        # Create new case
        result = supabase.table("cases").insert(case).execute()
        case["id"] = result.data[0]["id"]
        cases.append(case)
        print(f"Created case: {case['title']}")
    except Exception as e:
        print(f"Error creating case {case['title']}: {str(e)}")
        return None
    
    return cases

def insert_case_participants(cases, users):
    print("\nInserting case participants...")
    for case in cases:
        # Add at least one lawyer and one client to each case
        lawyer = random.choice([u for u in users if u["role"] == "lawyer"])
        client = random.choice([u for u in users if u["role"] == "client"])
        
        participants = [lawyer, client]
        # Add 1-2 additional participants randomly
        additional_participants = random.sample(users, random.randint(1, 2))
        participants.extend(additional_participants)
        
        for user in participants:
            try:
                # Check if participant already exists
                result = supabase.table("case_participants").select("id").eq("case_id", case["id"]).eq("user_id", user["id"]).execute()
                if result.data:
                    print(f"Participant {user['email']} already exists in case {case['title']}, skipping...")
                    continue
                
                supabase.table("case_participants").insert({
                    "case_id": case["id"],
                    "user_id": user["id"],
                    "role": user["role"]
                }).execute()
                print(f"Added participant {user['email']} to case {case['title']}")
            except Exception as e:
                print(f"Error adding participant {user['email']} to case {case['title']}: {str(e)}")

def send_notifications(user: Dict, case: Dict, message: str):
    """Send notifications through multiple channels."""
    # Email notification
    if user.get('email'):
        try:
            email = Mail(
                from_email=os.getenv('SENDGRID_FROM_EMAIL'),
                to_emails=user['email'],
                subject=f"New update for case: {case['title']}",
                html_content=message
            )
            sendgrid_client.send(email)
        except Exception as e:
            print(f"Error sending email: {str(e)}")

    # SMS notification
    if user.get('phone_number'):
        try:
            twilio_client.messages.create(
                body=f"Case Update: {case['title']}\n{message}",
                from_=os.getenv('TWILIO_PHONE_NUMBER'),
                to=user['phone_number']
            )
        except Exception as e:
            print(f"Error sending SMS: {str(e)}")

    # Slack notification
    if user.get('slack_id'):
        try:
            slack_client.chat_postMessage(
                channel=user['slack_id'],
                text=f"*Case Update: {case['title']}*\n{message}"
            )
        except SlackApiError as e:
            print(f"Error sending Slack message: {str(e)}")

def analyze_note_with_azure(content: str) -> Dict:
    """Analyze note content using Azure Cognitive Services."""
    try:
        # Sentiment analysis
        sentiment_result = text_analytics_client.analyze_sentiment([content])[0]
        
        # Key phrase extraction
        key_phrases_result = text_analytics_client.extract_key_phrases([content])[0]
        
        # Entity recognition
        entities_result = text_analytics_client.recognize_entities([content])[0]
        
        return {
            'sentiment': sentiment_result.sentiment,
            'confidence_scores': sentiment_result.confidence_scores,
            'key_phrases': key_phrases_result.key_phrases,
            'entities': [{'text': entity.text, 'category': entity.category} 
                        for entity in entities_result.entities]
        }
    except Exception as e:
        print(f"Error analyzing note with Azure: {str(e)}")
        return {}

def create_calendar_event(event_data: Dict) -> Dict:
    """Create calendar event across multiple platforms."""
    event_ids = {}
    
    # Create in Microsoft Graph (Outlook)
    try:
        outlook_event = {
            'subject': event_data['title'],
            'body': {
                'contentType': 'HTML',
                'content': event_data['description']
            },
            'start': {
                'dateTime': event_data['start_time'],
                'timeZone': 'UTC'
            },
            'end': {
                'dateTime': event_data['end_time'],
                'timeZone': 'UTC'
            },
            'location': {
                'displayName': event_data.get('location', '')
            }
        }
        outlook_result = graph_client.post('/me/events', json=outlook_event)
        event_ids['outlook_id'] = outlook_result.json()['id']
    except Exception as e:
        print(f"Error creating Outlook event: {str(e)}")

    # Create in Google Calendar
    try:
        google_event = {
            'summary': event_data['title'],
            'description': event_data['description'],
            'start': {
                'dateTime': event_data['start_time'],
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': event_data['end_time'],
                'timeZone': 'UTC',
            },
            'location': event_data.get('location', ''),
        }
        google_result = calendar_service.events().insert(
            calendarId='primary', 
            body=google_event
        ).execute()
        event_ids['google_id'] = google_result.get('id')
    except Exception as e:
        print(f"Error creating Google Calendar event: {str(e)}")

    # Create Zoom meeting if it's a virtual event
    if event_data.get('is_virtual', False):
        try:
            zoom_meeting = zoom_client.meeting.create(
                user_id='me',
                topic=event_data['title'],
                type=2,  # Scheduled meeting
                start_time=event_data['start_time'],
                duration=60,  # Default 1 hour
                timezone='UTC'
            )
            event_ids['zoom_id'] = zoom_meeting['id']
        except Exception as e:
            print(f"Error creating Zoom meeting: {str(e)}")

    return event_ids

def insert_messages(cases, users):
    print("\nInserting messages...")
    for case in cases:
        num_messages = random.randint(5, 15)
        for _ in range(num_messages):
            sender = random.choice(users)
            recipient = random.choice([u for u in users if u != sender])
            message = {
                "case_id": case["id"],
                "sender_id": sender["id"],
                "recipient_id": recipient["id"],
                "message_type": random.choice(VALID_MESSAGE_TYPES),
                "content": f"Message from {sender['email']} about {case['title']}",
                "read": random.choice([True, False]),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            try:
                result = supabase.table("messages").insert(message).execute()
                print(f"Created message for case {case['title']}")
                
                # Send notifications through multiple channels
                send_notifications(sender, case, message['content'])
                send_notifications(recipient, case, message['content'])
                
            except Exception as e:
                print(f"Error creating message for case {case['title']}: {str(e)}")

def insert_notes(cases, users):
    print("\nInserting notes...")
    for case in cases:
        num_notes = random.randint(3, 8)
        for _ in range(num_notes):
            author = random.choice(users)
            note_content = f"Note from {author['email']} about {case['title']}"
            
            # Analyze note with Azure Cognitive Services
            analysis_results = analyze_note_with_azure(note_content)
            
            note = {
                "case_id": case["id"],
                "user_id": author["id"],
                "content": note_content,
                "sentiment": analysis_results.get('sentiment'),
                "confidence_scores": json.dumps(analysis_results.get('confidence_scores')),
                "key_phrases": json.dumps(analysis_results.get('key_phrases')),
                "entities": json.dumps(analysis_results.get('entities')),
                "is_private": random.choice(note_privacy),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            try:
                result = supabase.table("notes").insert(note).execute()
                print(f"Created note for case {case['title']}")
            except Exception as e:
                print(f"Error creating note for case {case['title']}: {str(e)}")

def insert_calendar_events(cases, users):
    print("\nInserting calendar events...")
    for case in cases:
        num_events = random.randint(2, 5)
        for _ in range(num_events):
            organizer = random.choice(users)
            start_date = datetime.now() + timedelta(days=random.randint(1, 30))
            end_date = start_date + timedelta(hours=random.randint(1, 4))
            
            event = {
                "case_id": case["id"],
                "user_id": organizer["id"],
                "title": f"Meeting for {case['title']}",
                "description": f"Event organized by {organizer['email']}",
                "start_time": start_date.isoformat(),
                "end_time": end_date.isoformat(),
                "location": "Virtual Meeting",
                "is_virtual": True,
                "type": random.choice(["meeting", "court_date", "deadline", "reminder"]),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            try:
                # Create event in Supabase
                result = supabase.table("calendar_events").insert(event).execute()
                print(f"Created calendar event for case {case['title']}")
                
                # Create events in multiple calendar platforms
                event_ids = create_calendar_event(event)
                
                # Update Supabase event with platform-specific IDs
                supabase.table("calendar_events").update({
                    "outlook_id": event_ids.get('outlook_id'),
                    "google_calendar_id": event_ids.get('google_id'),
                    "zoom_id": event_ids.get('zoom_id')
                }).eq("id", result.data[0]["id"]).execute()
                
            except Exception as e:
                print(f"Error creating calendar event for case {case['title']}: {str(e)}")

def update_rls_policies():
    print("\nUpdating RLS policies...")
    try:
        # Disable RLS temporarily
        supabase.rpc("exec_sql", {
            "sql": "ALTER TABLE case_participants DISABLE ROW LEVEL SECURITY;"
        }).execute()
        
        # Drop existing policies
        supabase.rpc("exec_sql", {
            "sql": "DROP POLICY IF EXISTS \"Case participants are viewable by participants\" ON case_participants;"
        }).execute()
        
        supabase.rpc("exec_sql", {
            "sql": "DROP POLICY IF EXISTS \"Case participants can manage their participation\" ON case_participants;"
        }).execute()
        
        # Create new policies if they don't exist
        try:
            supabase.rpc("exec_sql", {
                "sql": """
                CREATE POLICY "Enable read access for case participants" ON case_participants
                    FOR SELECT USING (true);
                """
            }).execute()
        except Exception as e:
            if "already exists" not in str(e):
                raise e
        
        try:
            supabase.rpc("exec_sql", {
                "sql": """
                CREATE POLICY "Enable all access for service role" ON case_participants
                    FOR ALL USING (true);
                """
            }).execute()
        except Exception as e:
            if "already exists" not in str(e):
                raise e
        
        # Re-enable RLS
        supabase.rpc("exec_sql", {
            "sql": "ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;"
        }).execute()
        
        print("Updated RLS policies successfully")
        return True
    except Exception as e:
        print(f"Error updating RLS policies: {str(e)}")
        return False

def check_schema():
    print("\nChecking database schema...")
    try:
        # Get list of tables
        tables_sql = """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('messages', 'notes', 'calendar_events')
        ORDER BY table_name, ordinal_position;
        """
        result = supabase.rpc("exec_sql", {"sql": tables_sql}).execute()
        print("Schema information:", result)
    except Exception as e:
        print(f"Error checking schema: {str(e)}")

def main():
    print("Starting database seeding...")
    
    check_schema()
    
    update_rls_policies()
    create_law_firms_table()
    
    # Insert practice areas
    insert_practice_areas()
    
    # Insert law firm
    global firm_id
    firm_id = insert_law_firm()
    if not firm_id:
        print("Error: Failed to insert law firm")
        return
    
    # Insert users
    users = insert_users()
    if not users:
        print("Error: Failed to insert users")
        return
    
    # Insert cases
    cases = insert_cases(users)
    if not cases:
        print("Error: Failed to insert cases")
        return
    
    # Insert case participants
    insert_case_participants(cases, users)
    
    # Insert messages
    insert_messages(cases, users)
    
    # Insert notes
    insert_notes(cases, users)
    
    # Insert calendar events
    insert_calendar_events(cases, users)
    
    print("\nDatabase seeding completed!")

if __name__ == "__main__":
    main() 