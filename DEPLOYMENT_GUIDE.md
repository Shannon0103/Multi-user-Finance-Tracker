# 🚀 Deployment Guide - Personal Finance Tracker

## Multi-User Authentication Setup Complete! ✅

Your app now has user authentication using Clerk. Each user will have their own separate budgets and entries.

---

## 📋 What You Need to Deploy

### 1️⃣ **Setup Clerk Account (Free)**
Go to: https://clerk.com/

1. Sign up for a free Clerk account
2. Create a new application
3. Choose "Next.js" as your framework
4. Copy these keys from the Clerk dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

---

### 2️⃣ **Setup Database (Choose One)**

#### Option A: Neon (Recommended - Easier)
Go to: https://neon.tech/

1. Sign up for free account
2. Create a new project
3. Get your connection string from the dashboard
4. You'll get a URL like: `postgresql://user:password@hostname/database`

#### Option B: Supabase
Go to: https://supabase.com/

1. Sign up for free account
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI mode)

---

### 3️⃣ **Run Database Migration**

Once you have your database connection string, run this SQL in your database console:

```sql
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_budget_id ON entries(budget_id);
```

---

### 4️⃣ **Setup Vercel (Free Hosting)**
Go to: https://vercel.com/

1. Sign up with GitHub
2. Import your repository (push code to GitHub first)
3. Vercel will auto-detect Next.js

---

### 5️⃣ **Add Environment Variables in Vercel**

In your Vercel project settings → Environment Variables, add:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Database Connection (from Neon or Supabase)
PGUSER=your_db_user
PGHOST=your_db_host
PGDATABASE=your_db_name
PGPASSWORD=your_db_password
PGPORT=5432
```

**OR** you can use a single DATABASE_URL:
```bash
DATABASE_URL=postgresql://user:password@host/database
```

---

## 🔧 Local Development Setup

Create a `.env.local` file in the `expense-tracker` folder:

```bash
# Clerk Keys (from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Database (your local PostgreSQL or Neon/Supabase connection)
PGUSER=postgres
PGHOST=localhost
PGDATABASE=expense_tracker
PGPASSWORD=your_password
PGPORT=5432
```

Then run:
```bash
cd expense-tracker
npm run dev
```

---

## 📱 Testing Multi-User

1. Open the app
2. You'll see a sign-in screen (Clerk handles this automatically)
3. Create an account or sign in
4. Add budgets and entries
5. Sign out and create another account
6. Each user will have their own separate data!

---

## 🎯 Quick Deployment Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Add multi-user authentication"
   git branch -M main
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Setup Clerk** → Get API keys
3. **Setup Neon Database** → Get connection string
4. **Deploy to Vercel** → Connect GitHub repo
5. **Add environment variables** in Vercel
6. **Run database migration** in Neon SQL Editor
7. **Done!** Your app is live 🎉

---

## 🔒 Security Notes

- Each user's data is isolated by `user_id`
- Clerk handles all authentication securely
- Database queries filter by authenticated user
- All API routes require authentication

---

## 💡 Share Your App

Once deployed, you'll get a URL like: `your-app.vercel.app`

Share this URL with anyone! They can:
- Sign up for their own account
- Track their own budgets independently
- Access from any device (phone, tablet, computer)

---

## ❓ Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure database migration ran successfully
4. Check Clerk dashboard for authentication issues
