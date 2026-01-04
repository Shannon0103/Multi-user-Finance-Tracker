-- Complete Database Setup for Multi-User Finance Tracker

-- Create budgets table with user_id
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create entries table with user_id
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE,
  notes TEXT,
  user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_budget_id ON entries(budget_id);

-- If you already have existing tables without user_id, run these instead:
-- ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
-- ALTER TABLE entries ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
