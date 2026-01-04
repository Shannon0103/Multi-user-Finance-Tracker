## Master Prompt: Personal Monthly Finance Tracker

### Goal
Build a **visually polished, real-time personal finance tracker** using **React** that helps a single user track **monthly budgets and spending** from **January–December of each year** (starting 2026), with the ability to continue seamlessly into future years.

The app should be **simple, motivating, and user-friendly**, designed for daily personal use rather than enterprise complexity.

---

### Core Concepts
- The system is **budget-first**, not expense-first.
- Each **budget exists per month and per year**.
- All calculations (spent, remaining, progress) are **computed dynamically**.
- Data updates should reflect **immediately in the UI (real-time feel)**.

---

### Time Structure
- Users can select:
  - **Month** (January–December)
  - **Year** (e.g., 2026, 2027, …)
- Each month/year combination has its **own set of budgets and entries**.
- When moving to a new month, the app should optionally allow:
  - **Copying budgets from the previous month**.

---

### Monthly Total Budget Model

Each **month/year** has a **Total Monthly Budget** which represents the overall amount available for that month.

This total budget is then **broken down into multiple category budgets** (Transport, Leisure, Savings, etc.).

The relationship is:

**Month → Total Budget → Category Budgets → Entries / Sub-Entries**

---

### Budget Model
Each budget must support:
- **Budget Name** (e.g., Transport, Rent, Investments, Leisure, Custom)
- **Budget Type**:
  - Expense
  - Savings
  - Investment
  - Fixed (e.g., Insurance)
- **Monthly Allocation Amount**
- **Month & Year association**

Budgets are **user-defined** (not hardcoded).

---

### Entries (Spending / Allocation)
Each budget can have multiple entries.

Each entry includes:
- **Title / Description** (e.g., Uber, Anime Con, Small Cap)
- **Amount**
- **Date** (within the selected month)
- Optional **notes**

Entries are used for:
- Expenses
- Savings allocations
- Investment allocations

---

### Sub-Entries (Breakdowns)
Budgets must support **sub-entries** to allow breakdowns such as:
- Investments → Small Cap / Mid Cap / Large Cap
- Savings → Specific goals or purchases

Sub-entries are displayed as a breakdown within a budget.

---

### UI Layout Requirements

#### Top Bar
- **Month Selector** (dropdown)
- **Year Selector** (dropdown)

#### Main Dashboard
- **Grid of Budget Cards**

Each **Budget Card** displays:
- Budget Name
- **₹ Spent / ₹ Total Budget**
- **Visual Progress Bar**
  - Green: safely under budget
  - Yellow: nearing limit
  - Red: exceeded
- Budget Type indicator

Clicking a budget card opens a **detail view** showing:
- All entries
- Sub-entry breakdown (if any)
- Remaining amount

---

### Add Entry Interaction
- Floating **“+ Add Entry”** button visible on dashboard
- Opens a modal/form where user selects:
  - Budget
  - Entry title
  - Amount
  - Date
- On submit:
  - Data is saved
  - Dashboard updates instantly

---

### Visual & UX Principles
- Clean, modern, minimal design
- Motivating visuals (progress bars, clear numbers)
- No page reloads
- Responsive layout
- Beginner-friendly and distraction-free

---

### Data & Persistence
- Use **PostgreSQL** as the primary data store
- All data stored per:
  - Budget
  - Entry
  - Month
  - Year
- Designed to be easily deployable later (e.g., Vercel)

---

### Explicit Non-Goals (Out of Scope for Now)
- Authentication / multi-user support
- Bank integrations
- Excel import/export
- Mobile app

---

### Success Criteria
- User can track daily spending without friction
- Monthly budgets feel intuitive and motivating
- UI reflects changes instantly
- The system mirrors how a human naturally thinks about money

---

### Overall Intent
This app should feel like a **digital, structured version of handwritten monthly expense notes**, upgraded with:
- Automation
- Visual clarity
- Long-term scalability

The focus is **clarity, control, and consistency**, not financial complexity.

