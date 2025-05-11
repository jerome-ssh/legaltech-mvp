-- Migration: Add home_address to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_address TEXT; 