-- Create monthly_salary table to store total salary per user/month/year

CREATE TABLE IF NOT EXISTS monthly_salary (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month, year)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_monthly_salary_user_month_year ON monthly_salary(user_id, month, year);
