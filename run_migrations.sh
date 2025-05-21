#!/bin/bash

# Database connection details
DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_USER="postgres.ueqzjuclosoedybixqgs"
DB_NAME="postgres"
DB_PASSWORD="2u2JC6W1IxVqHtlE"
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@db.ueqzjuclosoedybixqgs.supabase.co:5432/$DB_NAME"

# Run migrations in order
echo "Running migrations..."

# Create audit log table
psql "$DB_URL" -f supabase/migrations/20240320000008_create_audit_log.sql

# Create role level enum and audit function
psql "$DB_URL" -f supabase/migrations/20240320000009_create_role_level_enum.sql

# Create roles table
psql "$DB_URL" -f supabase/migrations/20240320000010_create_roles.sql

echo "Migrations completed!" 