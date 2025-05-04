-- Create case_types table
CREATE TABLE IF NOT EXISTS case_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  value INTEGER NOT NULL
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  expenses DECIMAL(10,2) NOT NULL
);

-- Create billing table
CREATE TABLE IF NOT EXISTS billing (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL,
  paid DECIMAL(10,2) NOT NULL,
  outstanding DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  is_recurring BOOLEAN NOT NULL
);

-- Create client_feedback table
CREATE TABLE IF NOT EXISTS client_feedback (
  id SERIAL PRIMARY KEY,
  rating INTEGER NOT NULL,
  count INTEGER NOT NULL
); 