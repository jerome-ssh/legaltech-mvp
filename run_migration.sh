#!/bin/bash

# Exit on error
set -e

echo "Running certificate migration..."
echo "Please enter your Supabase project reference ID (e.g., abcdefghijklmnopqrst):"
read PROJECT_REF

echo "Please enter your database password:"
read -s DB_PASSWORD

echo "Running migration on project: $PROJECT_REF"

# Run the migration
PGPASSWORD=$DB_PASSWORD psql -h db.$PROJECT_REF.supabase.co -U postgres -f migrations/certificate_migration_direct.sql

echo "Migration completed successfully!" 