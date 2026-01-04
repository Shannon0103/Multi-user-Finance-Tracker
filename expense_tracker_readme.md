# 💰 Expense Tracker (Local-First)

A **local-first personal finance tracker** built with **Next.js, React, TypeScript, and Tailwind CSS**.  
This app helps track **monthly budgets, category-wise spending, and individual expense entries**, all with real-time visual feedback.

---

## 🧠 Background & Motivation

This project started from a very real problem:

Tracking expenses manually in phone notes like:
- Transport expenses day-by-day
- Savings deductions
- Investment allocations
- Leisure spends
- Insurance payments

This approach was:
- Unstructured
- Hard to analyze
- Impossible to scale month-to-month or year-to-year

The goal of this project is to replace that with a **clean, structured, visual dashboard** that mirrors how budgeting actually works in real life.

---

## 🎯 Product Vision

A **personal finance dashboard** that:
- Works locally first
- Is fast, simple, and user-friendly
- Tracks budgets **month-by-month and year-by-year**
- Allows full control over budgets and entries
- Provides clear visual feedback through progress bars

This is **not** a generic expense app — it is a **personal financial operating system**.

---

## 🧩 Core Mental Model

### Time-Based Structure
- Data is organized by **Year → Month**
- Each `(month, year)` pair is **fully isolated**
- Switching month/year shows different data

```
data[year-month] = {
  monthlyTotal,
  budgets[]
}
```

---

## 📆 Monthly Level (Top Level)

Each month has:
- A **Total Monthly Budget** (editable)
- A **Monthly Overview Card** showing:
  - Total spent
  - Total budget
  - Remaining amount
  - Progress bar (0–100%, capped on overspend)

This answers:
> "How am I doing overall this month?"

---

## 🗂️ Budget / Category Level

Each month contains multiple **Budget Categories**, such as:
- Transport
- Leisure
- Savings
- Investments
- Insurance
- Emergency Fund

Each budget has:
- Editable **name**
- Editable **allocated amount**
- A list of entries
- A **progress bar** (spent vs allocated)

Each budget card:
- Is fully clickable
- Opens a detailed modal
- Supports editing budget name & allocation

---

## 🧾 Entry Level (Lowest Level)

Entries represent individual transactions or allocations.

Each entry has:
- A title (e.g. `Uber`, `Anime Con`, `Emergency Fund`)
- An amount
- A parent budget
- A specific month & year

### Supported Entry Operations (CRUD)
- ➕ Add entry
- ✏️ Edit entry
- 🗑 Delete entry

All updates reflect instantly in:
- Budget totals
- Monthly totals
- Progress bars

---

## 🖥️ User Interface

### Dashboard Layout
- Top bar:
  - Month selector
  - Year selector
- Monthly Overview card
- Grid of budget cards
- Clean, modern, minimal UI

### Modals
- Budget details open in a modal
- Modal includes:
  - Close (✕) button
  - Entry list
  - Add / Edit / Delete entry controls

---

## ⚙️ Technical Stack

### Frontend
- **Next.js (App Router)**
- **React (Client Components)**
- **TypeScript**
- **Tailwind CSS**

### State Management
- React `useState`
- Single source of truth for all data
- No derived values stored (e.g. `spent` is always calculated)

---

## 💾 Data & Storage Strategy

### Current Phase (v1 – Local)
- In-memory state only
- No persistence across refreshes
- Ideal for rapid iteration and learning

### Planned Next Phase
- Local **PostgreSQL** database
- Same data model as current state
- Minimal UI refactor required

---

## ✅ Current Feature Status

### Implemented
- ✔ Month & year switching
- ✔ Monthly total budget (editable)
- ✔ Category budgets (editable)
- ✔ Entry-level CRUD
- ✔ Budget-level editing
- ✔ Real-time progress bars (monthly & category)
- ✔ Clean, user-friendly UI

### Planned / Future
- ⏳ PostgreSQL persistence
- ⏳ Budget types (expense / savings / investment)
- ⏳ Analytics & charts
- ⏳ Deployment (Vercel)

---

## 🚀 Long-Term Vision

This project is intended to evolve into:
- A personal finance analytics tool
- A yearly financial record system
- A deployable app without rewriting core logic

Built intentionally, step-by-step, with clarity and correctness.

---

## 🛠️ Getting Started (Local)

```bash
npm install
npm run dev
```

Open:
```
http://localhost:3000
```

---

## 📌 Notes

- This is a **learning-first, correctness-first** project
- Architecture is intentionally aligned with future database usage
- UI and data model are designed to scale without rewrites

---

**Author:** Personal project  
**Status:** Active development

