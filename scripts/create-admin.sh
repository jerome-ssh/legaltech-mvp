#!/bin/bash

# Check for required environment variables
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Error: SUPABASE_PROJECT_ID environment variable is not set"
    echo "Please set it by running: export SUPABASE_PROJECT_ID='ueqzjuclosoedybixqgs'"
    exit 1
fi

# Database connection details
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_USER="postgres.ueqzjuclosoedybixqgs"
DB_NAME="postgres"
DB_PASSWORD="kjjEb5NYRAFp8cK8"

# Create admin user and profile using psql directly
echo "Creating admin user and profile..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

PGPASSWORD=$DB_PASSWORD psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST/$DB_NAME" -f "$SCRIPT_DIR/create-admin.sql"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "Admin user created successfully!"
    echo "Login credentials:"
    echo "Email: admin@legaltech.com"
    echo "Password: Admin123!"
else
    echo "Error creating admin user"
    exit 1
fi 