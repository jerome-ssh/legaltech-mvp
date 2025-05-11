import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL', ''),
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
)

# Practice areas
practice_areas = [
    # Civil Law
    "Administrative Law",
    "Bankruptcy Law",
    "Business Law",
    "Civil Rights Law",
    "Class Action Litigation",
    "Commercial Law",
    "Construction Law",
    "Consumer Protection Law",
    "Contract Law",
    "Corporate Law",
    "Employment Law",
    "Environmental Law",
    "Family Law",
    "Health Care Law",
    "Immigration Law",
    "Insurance Law",
    "Intellectual Property Law",
    "Labor Law",
    "Landlord-Tenant Law",
    "Personal Injury Law",
    "Product Liability Law",
    "Real Estate Law",
    "Tax Law",
    "Tort Law",
    "Workers' Compensation Law",

    # Criminal Law
    "Criminal Defense",
    "Criminal Prosecution",
    "DUI/DWI Law",
    "Juvenile Law",
    "White Collar Crime",

    # Specialized Areas
    "Admiralty Law",
    "Aviation Law",
    "Banking Law",
    "Elder Law",
    "Entertainment Law",
    "Estate Planning",
    "International Law",
    "Military Law",
    "Nonprofit Law",
    "Patent Law",
    "Privacy Law",
    "Securities Law",
    "Sports Law",
    "Technology Law",
    "Trusts and Estates"
]

def update_practice_areas():
    print("\nUpdating practice areas...")
    
    # First, clear existing practice areas
    try:
        result = supabase.table("practice_areas").select("*").execute()
        if result.data:
            print(f"Found {len(result.data)} existing practice areas")
            for area in result.data:
                supabase.table("practice_areas").delete().eq("id", area["id"]).execute()
            print("Cleared existing practice areas")
    except Exception as e:
        print(f"Error clearing practice areas: {str(e)}")
        return

    # Insert new practice areas
    for area in practice_areas:
        try:
            supabase.table("practice_areas").insert({
                "name": area,
                "description": f"Legal services related to {area}"
            }).execute()
            print(f"Added practice area: {area}")
        except Exception as e:
            print(f"Error adding {area}: {str(e)}")

def main():
    print("Starting practice areas update...")
    update_practice_areas()
    print("\nPractice areas update completed!")

if __name__ == "__main__":
    main() 