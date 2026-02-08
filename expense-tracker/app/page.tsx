"use client";

import React, { useState } from "react";
import { UserButton } from '@clerk/nextjs';
import * as XLSX from 'xlsx';
import { useTheme } from './components/ThemeProvider';

/* =======================
   Types
======================= */

type Entry = {
  id: number;
  budget_id: number;
  title: string;
  amount: number;
  date?: string;
  notes?: string;
};

type Budget = {
  id: number;
  name: string;
  total: number;
  type: string;
};

/* =======================
   Helpers
======================= */

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/* =======================
   Component
======================= */

export default function Home() {
        const { theme, toggleTheme } = useTheme();
        // Menu state
        const [showMenu, setShowMenu] = useState(false);
        // Analytics modal state
        const [showAnalytics, setShowAnalytics] = useState(false);
        // What's New modal state
        const [showWhatsNew, setShowWhatsNew] = useState(false);
        // State for add entry modal
        const [showAddEntry, setShowAddEntry] = useState(false);
        const [addEntryBudgetIndex, setAddEntryBudgetIndex] = useState<number | null>(null);
        const [addEntryTitle, setAddEntryTitle] = useState("");
        const [addEntryAmount, setAddEntryAmount] = useState<number>(0);
        const [addEntryDate, setAddEntryDate] = useState("");
        const [addEntryNotes, setAddEntryNotes] = useState("");
      // Track which budget card's menu is open
      const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    // State for editing a budget's total
    const [editingBudgetIndex, setEditingBudgetIndex] = useState<number | null>(null);
    const [budgetTotalDraft, setBudgetTotalDraft] = useState<number>(0);
    const [budgetNameDraft, setBudgetNameDraft] = useState("");
    const [budgetTypeDraft, setBudgetTypeDraft] = useState("Expense");
  // State for editing monthly budget
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [monthlyDraft, setMonthlyDraft] = useState(0);
        // Entry modal state for editing
        const [editingEntry, setEditingEntry] = useState<{id: number, title: string, amount: number, date?: string, notes?: string} | null>(null);
      // Modal state for adding a new budget
      const [showAddBudget, setShowAddBudget] = useState(false);
      const [newBudgetName, setNewBudgetName] = useState("");
      const [newBudgetType, setNewBudgetType] = useState("Expense");
      const [newBudgetTotal, setNewBudgetTotal] = useState<number>(0);

    // Entry adding state for budget modal
    const [newTitle, setNewTitle] = useState("");
    const [newAmount, setNewAmount] = useState<number>(0);
    const [newDate, setNewDate] = useState("");
    const [newNotes, setNewNotes] = useState("");
  /* =======================
     Month / Year Selection
  ======================= */

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // Current month (0-11)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /* =======================
     All Data (Key Change)
  ======================= */

  // Backend state
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0); // Base salary for this month
  const [carryforward, setCarryforward] = useState<number>(0); // Carryforward from previous month
  const [loading, setLoading] = useState(false);

  // Load budgets and entries for selected month/year
  async function loadBudgetsAndEntries() {
    setLoading(true);
    // Fetch budgets (send month as 1-12 to backend)
    const res = await fetch(`/api/budgets?month=${selectedMonth + 1}&year=${selectedYear}`);
    let budgetsData: Budget[] = await res.json();
    
    // Auto-create recurring budgets (Savings, Investment, Fixed) from previous month if not exist
    // Only check when current month has no budgets at all
    if (budgetsData.length === 0) {
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = selectedYear - 1;
      }
      
      try {
        // Fetch previous month's budgets
        const prevBudgetsRes = await fetch(`/api/budgets?month=${prevMonth + 1}&year=${prevYear}`);
        const prevBudgets: Budget[] = await prevBudgetsRes.json();
        
        // Find recurring budget types (Savings, Investment, Fixed)
        const recurringBudgets = prevBudgets.filter(b => 
          b.type === 'Savings' || b.type === 'Investment' || b.type === 'Fixed'
        );
        
        // Check which recurring budgets don't exist in current month
        for (const prevBudget of recurringBudgets) {
          const exists = budgetsData.some(b => 
            b.name === prevBudget.name && b.type === prevBudget.type
          );
          
          if (!exists) {
            // Create the recurring budget for current month
            const createRes = await fetch('/api/budgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: prevBudget.name,
                type: prevBudget.type,
                total: prevBudget.total,
                month: selectedMonth + 1,
                year: selectedYear,
              }),
            });
            
            if (createRes.ok) {
              const newBudget = await createRes.json();
              budgetsData.push(newBudget);
            }
          }
        }
      } catch (error) {
        console.log('Could not auto-create recurring budgets');
      }
    }
    
    setBudgets(budgetsData);
    // Fetch entries for all budgets
    let allEntries: Entry[] = [];
    for (const b of budgetsData) {
      const eres = await fetch(`/api/entries?budget_id=${b.id}`);
      const eData: Entry[] = await eres.json();
      allEntries = allEntries.concat(eData);
    }
    setEntries(allEntries);
    // Fetch monthly salary
    try {
      const salaryRes = await fetch(`/api/salary?month=${selectedMonth + 1}&year=${selectedYear}`);
      if (salaryRes.ok) {
        const salaryData = await salaryRes.json();
        setMonthlyTotal(Number(salaryData.salary) || 0);
      } else {
        setMonthlyTotal(0);
      }
    } catch (error) {
      console.log('Salary table not yet created, defaulting to 0');
      setMonthlyTotal(0);
    }
    
    // Calculate carryforward from previous month
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = selectedYear - 1;
    }
    
    try {
      // Fetch previous month's budgets
      const prevBudgetsRes = await fetch(`/api/budgets?month=${prevMonth + 1}&year=${prevYear}`);
      const prevBudgets: Budget[] = await prevBudgetsRes.json();
      
      // Fetch previous month's entries
      let prevEntries: Entry[] = [];
      for (const b of prevBudgets) {
        const eres = await fetch(`/api/entries?budget_id=${b.id}`);
        const eData: Entry[] = await eres.json();
        prevEntries = prevEntries.concat(eData);
      }
      
      // Fetch previous month's salary
      const prevSalaryRes = await fetch(`/api/salary?month=${prevMonth + 1}&year=${prevYear}`);
      let prevSalary = 0;
      if (prevSalaryRes.ok) {
        const prevSalaryData = await prevSalaryRes.json();
        prevSalary = Number(prevSalaryData.salary) || 0;
      }
      
      // Calculate previous month's total spent
      const prevSpent = prevEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      // Carryforward = Previous month's remaining (salary - spent)
      const carryforwardAmount = Math.max(0, prevSalary - prevSpent);
      setCarryforward(carryforwardAmount);
    } catch (error) {
      console.log('Could not calculate carryforward, defaulting to 0');
      setCarryforward(0);
    }
    
    setLoading(false);
  }

  // Load on mount and when month/year changes
  React.useEffect(() => {
    loadBudgetsAndEntries();
    // eslint-disable-next-line
  }, [selectedMonth, selectedYear]);

  /* =======================
     UI State
  ======================= */

  const [selectedBudgetIndex, setSelectedBudgetIndex] =
    useState<number | null>(null);

  /* =======================
     Helpers
  ======================= */

  // Helper: get entries for a budget
  const getBudgetEntries = (budgetId: number) => entries.filter(e => e.budget_id === budgetId);
  const calculateSpent = (budgetId: number) => getBudgetEntries(budgetId).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalSpent = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalAllocated = budgets.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  const safeMonthlyTotal = isNaN(monthlyTotal) ? 0 : monthlyTotal; // Base salary
  const safeCarryforward = isNaN(carryforward) ? 0 : carryforward;
  const totalSalary = safeMonthlyTotal + safeCarryforward; // Total = Base + Carryforward
  const safeTotalAllocated = isNaN(totalAllocated) ? 0 : totalAllocated;
  const safeTotalSpent = isNaN(totalSpent) ? 0 : totalSpent;
  const remaining = totalSalary - safeTotalSpent;
  const unallocated = totalSalary - safeTotalAllocated;

  // Download dashboard data as Excel
  function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Personal Finance Tracker'],
      ['Month:', months[selectedMonth]],
      ['Year:', selectedYear],
      [],
      ['Base Salary:', monthlyTotal],
      ['Carryforward from Previous Month:', carryforward],
      ['Total Salary:', totalSalary],
      ['Total Allocated:', totalAllocated],
      ['Total Spent:', totalSpent],
      ['Unallocated:', unallocated],
      ['Remaining (will carryforward):', remaining],
      [],
      ['Budget Summary'],
      ['Budget Name', 'Type', 'Allocated', 'Spent', 'Remaining', 'Progress %']
    ];

    budgets.forEach(budget => {
      const budgetEntries = getBudgetEntries(budget.id);
      const spent = budgetEntries.reduce((sum, e) => sum + e.amount, 0);
      const budgetRemaining = budget.total - spent;
      const progress = budget.total > 0 ? (spent / budget.total * 100).toFixed(1) : '0';
      
      summaryData.push([
        budget.name,
        budget.type,
        budget.total,
        spent,
        budgetRemaining,
        progress + '%'
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Detailed entries sheet
    const entriesData = [['Budget', 'Entry Title', 'Amount', 'Date', 'Notes']];
    
    budgets.forEach(budget => {
      const budgetEntries = getBudgetEntries(budget.id);
      budgetEntries.forEach(entry => {
        entriesData.push([
          budget.name,
          entry.title,
          entry.amount.toString(),
          entry.date || '',
          entry.notes || ''
        ]);
      });
    });

    const entriesSheet = XLSX.utils.aoa_to_sheet(entriesData);
    XLSX.utils.book_append_sheet(workbook, entriesSheet, 'All Entries');

    // Download file
    const fileName = `Finance_Tracker_${months[selectedMonth]}_${selectedYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /* =======================
     UI
  ======================= */


  return (
    <main className="min-h-screen bg-[#f3f6fb] dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      {/* Floating Add Entry Button */}
      <button
        className="fixed bottom-28 right-10 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg px-6 py-4 text-lg font-semibold z-50 flex items-center gap-2"
        onClick={() => {
          setShowAddEntry(true);
          setAddEntryBudgetIndex(budgets.length > 0 ? 0 : null);
          setAddEntryTitle("");
          setAddEntryAmount(0);
          setAddEntryDate("");
          setAddEntryNotes("");
        }}
      >
        + Add Entry
      </button>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-gray-100">Add Entry</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Budget</label>
              <select
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addEntryBudgetIndex ?? ''}
                onChange={e => setAddEntryBudgetIndex(Number(e.target.value))}
              >
                {budgets.map((b, i) => (
                  <option key={b.id} value={i}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Title</label>
              <input
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addEntryTitle}
                onChange={e => setAddEntryTitle(e.target.value)}
                placeholder="e.g. Uber, Anime Con"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Amount (₹)</label>
              <input
                type="number"
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addEntryAmount}
                onChange={e => setAddEntryAmount(Number(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Date</label>
              <input
                type="date"
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addEntryDate}
                onChange={e => setAddEntryDate(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Notes</label>
              <textarea
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={addEntryNotes}
                onChange={e => setAddEntryNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowAddEntry(false)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold"
                onClick={async () => {
                  if (addEntryBudgetIndex === null || !addEntryTitle || addEntryAmount <= 0) return;
                  const budgetId = budgets[addEntryBudgetIndex].id;
                  await fetch('/api/entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      budget_id: budgetId,
                      title: addEntryTitle,
                      amount: addEntryAmount,
                      date: addEntryDate,
                      notes: addEntryNotes,
                    }),
                  });
                  setShowAddEntry(false);
                  loadBudgetsAndEntries();
                }}
              >Add Entry</button>
            </div>
          </div>
        </div>
      )}
      {/* Header Bar */}
      <header className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex-1"></div>
        
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Personal Finance Tracker</h1>
        
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Month/Year Selectors */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {/* Menu Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-xl"
              title="Menu"
            >
              ☰
            </button>
            
            {showMenu && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => {
                      setMonthlyDraft(monthlyTotal);
                      setEditingMonthly(true);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-b dark:border-gray-600"
                  >
                    <span className="text-base">✏️</span> Edit Base Salary
                  </button>
                  
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-b dark:border-gray-600"
                  >
                    <span className="text-base">{theme === 'light' ? '🌙' : '☀️'}</span> {theme === 'light' ? 'Dark' : 'Light'} Mode
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAnalytics(true);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-b dark:border-gray-600"
                  >
                    <span className="text-base">📈</span> View Analytics
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowWhatsNew(true);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-b dark:border-gray-600"
                  >
                    <span className="text-base">🎉</span> What's New
                  </button>
                  
                  <button
                    onClick={() => {
                      downloadExcel();
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-b dark:border-gray-600"
                  >
                    <span className="text-base">📊</span> Download Excel
                  </button>
                  
                  <div className="px-4 py-3 flex items-center gap-2">
                    <UserButton afterSignOutUrl="/" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Account</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Edit Monthly Budget Modal */}
      {editingMonthly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow w-full max-w-sm">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Base Salary for {months[selectedMonth]}</h2>
            {safeCarryforward > 0 && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Carryforward from previous month:</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">₹{Number(safeCarryforward).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Current base salary:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">₹{Number(monthlyTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300 dark:border-green-600 mt-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Total Available:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">₹{Number(totalSalary).toLocaleString()}</span>
                </div>
              </div>
            )}
            <input
              type="number"
              className="border dark:border-gray-600 rounded px-2 py-1 w-full mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={monthlyDraft}
              onChange={e => setMonthlyDraft(Number(e.target.value) || 0)}
              min={0}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingMonthly(false)}
                className="border dark:border-gray-600 px-3 py-1 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >Cancel</button>
              <button
                onClick={async () => {
                  const newSalary = Number(monthlyDraft) || 0;
                  setMonthlyTotal(newSalary);
                  // Save to database
                  await fetch('/api/salary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      month: selectedMonth + 1,
                      year: selectedYear,
                      salary: newSalary,
                    }),
                  });
                  setEditingMonthly(false);
                }}
                className="bg-black dark:bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-800 dark:hover:bg-gray-500"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Card */}
      <section className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-500 text-xl">ⓘ</span>
            <span className="font-semibold text-base text-gray-900 dark:text-gray-100">Budget Overview</span>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex gap-4 text-lg font-semibold">
              <span className="text-gray-900 dark:text-gray-100">Total Salary: <span className="text-gray-900 dark:text-gray-100 font-bold">₹ {Number(totalSalary).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span className="text-gray-900 dark:text-gray-100">Spent: <span className="text-blue-700 dark:text-blue-400 font-bold">₹ {Number(totalSpent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span className="text-gray-900 dark:text-gray-100">Unallocated: <span className="text-orange-600 dark:text-orange-400 font-bold">₹ {Number(unallocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span className="text-gray-900 dark:text-gray-100">Remaining: <span className="text-green-700 dark:text-green-400 font-bold">₹ {Number(totalAllocated - totalSpent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
            </div>
            {safeCarryforward > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-green-700 dark:text-green-400 font-medium">
                  💰 Base Salary: ₹{Number(safeMonthlyTotal).toLocaleString()}
                </span>
                <span className="text-gray-400">＋</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-800/30 border border-green-300 dark:border-green-600 rounded text-green-800 dark:text-green-300 font-semibold">
                  ↑ Carryforward: ₹{Number(safeCarryforward).toLocaleString()}
                </span>
                <span className="text-gray-400">＝</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 font-bold">
                  Total: ₹{Number(totalSalary).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {/* Three-tier visualization bar */}
          <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
            {/* Allocated portion (translucent purple overlay) */}
            <div
              className="absolute top-0 left-0 h-6 bg-purple-400 opacity-40 rounded-full transition-all"
              style={{
                width: `${totalSalary > 0 ? Math.min((safeTotalAllocated / totalSalary) * 100, 100) : 0}%`,
              }}
            />
            {/* Spent portion (solid color filling) */}
            <div
              className={`absolute top-0 left-0 h-6 rounded-full transition-all ${totalSalary > 0 && safeTotalSpent / totalSalary > 1 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{
                width: `${totalSalary > 0 ? Math.min((safeTotalSpent / totalSalary) * 100, 100) : 0}%`,
              }}
            />
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 text-sm mt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-600">Total Salary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-400 opacity-40 rounded"></div>
              <span className="text-gray-600">Allocated ({totalSalary > 0 ? Math.round((safeTotalAllocated / totalSalary) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Spent ({totalSalary > 0 ? Math.round((safeTotalSpent / totalSalary) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </section>


      {/* Budget Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgets.map((budget, index) => {
          const spent = Number(calculateSpent(budget.id)) || 0;
          const safeBudgetTotal = Number(budget.total) || 0;
          const percentUsed = safeBudgetTotal > 0 ? (spent / safeBudgetTotal) * 100 : 0;
          
          // Progress bar color based on percentage (only for Expense type)
          let progressBarColor = 'bg-green-500';
          let warningMessage = '';
          
          if (budget.type === 'Expense') {
            if (percentUsed >= 50 && percentUsed < 80) {
              progressBarColor = 'bg-yellow-500';
            } else if (percentUsed >= 80) {
              progressBarColor = 'bg-red-500';
            }
            
            // Warning message only for Expense type
            if (percentUsed >= 100) {
              warningMessage = spent > safeBudgetTotal ? 'Overexceeding budget' : 'You have used the whole budget';
            }
          }
          // Icon, color, and progress bar color by category name (simple mapping)
          const categoryMeta: Record<string, {icon: string, color: string, bar: string}> = {
            Transport: { icon: '🚗', color: 'text-orange-500', bar: 'bg-yellow-400' },
            'Personal Savings': { icon: '💚', color: 'text-green-600', bar: 'bg-green-500' },
            Investments: { icon: '🏠', color: 'text-blue-700', bar: 'bg-blue-500' },
            'Leisure Spending': { icon: '💛', color: 'text-orange-400', bar: 'bg-yellow-400' },
            Insurance: { icon: '❤️', color: 'text-red-600', bar: 'bg-red-500' },
            Rent: { icon: '🏡', color: 'text-green-700', bar: 'bg-green-600' },
            Savings: { icon: '💚', color: 'text-green-600', bar: 'bg-green-500' },
          };
          const meta = categoryMeta[budget.name] || { icon: '📁', color: 'text-gray-500', bar: 'bg-gray-400' };
          const budgetEntries = getBudgetEntries(budget.id);
          return (
            <div
              key={budget.id}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-2 min-h-[160px] hover:shadow-lg transition cursor-pointer group"
              onClick={e => {
                // Only open modal if not clicking the 3-dot menu
                if (!(e.target as HTMLElement).closest('.budget-menu-btn')) {
                  setSelectedBudgetIndex(index);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Open ${budget.name} details`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${meta.color}`}>{meta.icon}</span>
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{budget.name}</span>
                </div>
                <div className="relative">
                  <button
                    className="budget-menu-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-2 py-1 rounded-full focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === index ? null : index);
                    }}
                  >&#8942;</button>
                  {/* Dropdown menu */}
                  {openMenuIndex === index && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow z-10">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                        onClick={e => {
                          e.stopPropagation();
                          setEditingBudgetIndex(index);
                          setBudgetTotalDraft(budget.total);
                          setBudgetNameDraft(budget.name);
                          setBudgetTypeDraft(budget.type);
                          setOpenMenuIndex(null);
                        }}
                      >Edit Budget</button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400"
                        onClick={async e => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this budget?')) {
                            try {
                              const res = await fetch(`/api/budgets/${budget.id}`, { method: 'DELETE' });
                              if (!res.ok) {
                                alert('Failed to delete budget. Make sure there are no entries linked to this budget.');
                              } else {
                                loadBudgetsAndEntries();
                              }
                            } catch (err) {
                              alert('Error deleting budget.');
                            }
                          }
                          setOpenMenuIndex(null);
                        }}
                      >Delete Budget</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="font-bold text-lg mb-1 text-gray-900 dark:text-gray-100">
                ₹{Number(spent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="font-normal text-gray-500 dark:text-gray-400">/ ₹{Number(budget.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="block text-xs text-green-700 dark:text-green-400 font-semibold mt-1">Remaining: ₹{Number((safeBudgetTotal - spent)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${progressBarColor}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              
              {/* Warning Messages and Caution Sign */}
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  {budget.type === 'Expense' && percentUsed >= 80 && (
                    <span className="animate-pulse text-red-500 text-lg" title="Warning: High budget usage">⚠️</span>
                  )}
                  {warningMessage && (
                    <span className="text-red-600 dark:text-red-400 font-semibold">{warningMessage}</span>
                  )}
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {Math.round(percentUsed)}% of Budget Used
                </span>
              </div>
              <ul className="text-sm space-y-1">
                {budgetEntries.slice(0, 2).map((entry, i) => (
                  <li key={entry.id} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{entry.title}</span>
                    <span className="ml-2 text-gray-400 dark:text-gray-500">{entry.date ? new Date(entry.date).toLocaleDateString() : ''}</span>
                    <span className="ml-2 text-gray-400 dark:text-gray-500 italic">{entry.notes ? `(${entry.notes})` : ''}</span>
                    <span className="ml-auto font-semibold text-gray-900 dark:text-gray-100">₹{Number(entry.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </li>
                ))}
                {budgetEntries.length === 0 && (
                  <li className="text-gray-400 italic">No entries</li>
                )}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Edit Budget Modal (always rendered at root, not inside map) */}
      {editingBudgetIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow w-full max-w-sm">
                    <h2 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Edit Budget</h2>
                    <div className="mb-3">
                      <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Budget Name</label>
                      <input
                        className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={budgetNameDraft}
                        onChange={e => setBudgetNameDraft(e.target.value)}
                        placeholder="e.g. Transport, Rent, Investments"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Budget Type</label>
                      <select
                        className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={budgetTypeDraft}
                        onChange={e => setBudgetTypeDraft(e.target.value)}
                      >
                        <option value="Expense">Expense</option>
                        <option value="Savings">Savings</option>
                        <option value="Investment">Investment</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </div>
                    <div className="mb-6">
                      <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Monthly Allocation (₹)</label>
                      <input
                        type="number"
                        className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={budgetTotalDraft}
                        onChange={e => setBudgetTotalDraft(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingBudgetIndex(null)}
                        className="border dark:border-gray-600 px-3 py-1 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >Cancel</button>
                      <button
                        onClick={() => {
                          if (editingBudgetIndex === null) return;
                          const budgetId = budgets[editingBudgetIndex].id;
                          fetch(`/api/budgets/${budgetId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: budgetNameDraft,
                              type: budgetTypeDraft,
                              total: budgetTotalDraft,
                            }),
                          }).then(() => {
                            setEditingBudgetIndex(null);
                            loadBudgetsAndEntries();
                          });
                        }}
                        className="bg-black dark:bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-800 dark:hover:bg-gray-500"
                      >Save</button>
                    </div>
                  </div>
                </div>
              )}

      {/* Floating Add Budget Button */}
      <button
        className="fixed bottom-10 right-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg px-6 py-4 text-lg font-semibold z-50 flex items-center gap-2"
        onClick={() => setShowAddBudget(true)}
      >
        + Add Budget
      </button>

      {/* Add Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-gray-100">Add New Budget</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Budget Name</label>
              <input
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newBudgetName}
                onChange={e => setNewBudgetName(e.target.value)}
                placeholder="e.g. Transport, Rent, Investments"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Budget Type</label>
              <select
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newBudgetType}
                onChange={e => setNewBudgetType(e.target.value)}
              >
                <option value="Expense">Expense</option>
                <option value="Savings">Savings</option>
                <option value="Investment">Investment</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Monthly Allocation (₹)</label>
              <input
                type="number"
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newBudgetTotal}
                onChange={e => setNewBudgetTotal(Number(e.target.value) || 0)}
                placeholder="e.g. 3000"
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowAddBudget(false)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
                onClick={async () => {
                  if (!newBudgetName || newBudgetTotal <= 0) return;
                  await fetch('/api/budgets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: newBudgetName,
                      type: newBudgetType,
                      total: newBudgetTotal,
                      month: selectedMonth + 1,
                      year: selectedYear,
                    }),
                  });
                  setShowAddBudget(false);
                  setNewBudgetName("");
                  setNewBudgetType("Expense");
                  setNewBudgetTotal(0);
                  loadBudgetsAndEntries();
                }}
              >Add Budget</button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {selectedBudgetIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {budgets[selectedBudgetIndex].name}
              </h2>
              <button
                onClick={() => setSelectedBudgetIndex(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Entries */}
            <div className="max-h-96 overflow-y-auto mb-4">
              <ul className="space-y-2">
                {getBudgetEntries(budgets[selectedBudgetIndex].id).map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1 rounded-md bg-gray-50 dark:bg-gray-700 p-2"
                >
                  {editingEntry && editingEntry.id === entry.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={editingEntry.title}
                          onChange={e => setEditingEntry({...editingEntry, title: e.target.value})}
                        />
                        <input
                          type="number"
                          className="border dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={editingEntry.amount}
                          onChange={e => setEditingEntry({...editingEntry, amount: Number(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="border dark:border-gray-600 rounded px-2 py-1 w-40 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={editingEntry.date || ''}
                          onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                        />
                        <input
                          className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="Notes"
                          value={editingEntry.notes || ''}
                          onChange={e => setEditingEntry({...editingEntry, notes: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={async () => {
                            await fetch(`/api/entries/${entry.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: editingEntry.title,
                                amount: editingEntry.amount,
                                date: editingEntry.date,
                                notes: editingEntry.notes,
                              }),
                            });
                            setEditingEntry(null);
                            loadBudgetsAndEntries();
                          }}
                          className="text-green-600"
                        >✓</button>
                        <button
                          onClick={() => setEditingEntry(null)}
                          className="text-gray-400"
                        >✕</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.title}</span>
                        <span className="ml-2 text-gray-400 dark:text-gray-500">{entry.date ? new Date(entry.date).toLocaleDateString() : ''}</span>
                        <span className="ml-auto font-semibold text-gray-900 dark:text-gray-100">₹{entry.amount.toLocaleString()}</span>
                      </div>
                      {entry.notes && (
                        <div className="text-xs text-gray-500 italic pl-1">{entry.notes}</div>
                      )}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setEditingEntry({id: entry.id, title: entry.title, amount: entry.amount, date: entry.date, notes: entry.notes})}
                          className="text-blue-600"
                        >✏️</button>
                        <button
                          onClick={async () => {
                            await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
                            loadBudgetsAndEntries();
                          }}
                          className="text-red-600"
                        >🗑</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              </ul>
            </div>

            {/* ➕ Add Entry */}
            <div className="border-t dark:border-gray-700 pt-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Add Entry</h3>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    className="border dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    className="border dark:border-gray-600 rounded px-2 py-1 w-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                  <input
                    className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Notes (optional)"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                  />
                  <button
                    onClick={async () => {
                      if (!newTitle || newAmount <= 0) return;
                      await fetch('/api/entries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          budget_id: budgets[selectedBudgetIndex].id,
                          title: newTitle,
                          amount: newAmount,
                          date: newDate,
                          notes: newNotes,
                        }),
                      });
                      setNewTitle("");
                      setNewAmount(0);
                      setNewDate("");
                      setNewNotes("");
                      loadBudgetsAndEntries();
                    }}
                    className="rounded bg-black px-3 text-white hover:bg-gray-800"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What's New Modal */}
      {showWhatsNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🎉 What's New</h2>
              <button
                onClick={() => setShowWhatsNew(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl px-2"
              >✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Recent Updates */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Recent Updates</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">📊 Analytics Dashboard</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View detailed spending insights with pie charts, bar graphs, and financial summaries</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">🔄 Recurring Budgets</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Savings, Investment, and Fixed budgets automatically carry over to new months</p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">⚠️ Budget Progress Indicators</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Color-coded progress bars (green/yellow/red) with warnings at 80% and 100% usage</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">🌙 Dark Mode</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toggle between light and dark themes with persistent preference</p>
                  </div>
                  
                  <div className="border-l-4 border-teal-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">📜 Scrollable Entries Modal</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Entries list with height limit and vertical scrolling for better mobile usability</p>
                  </div>
                  
                  <div className="border-l-4 border-cyan-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">📅 Auto-Open Current Month</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">App automatically loads current month and year on startup for instant access</p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">💾 Total Salary Persistence</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monthly salary securely saved to database with easy editing and error handling</p>
                  </div>
                  
                  <div className="border-l-4 border-emerald-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">➕ Automatic Carryforward</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Previous month's remaining balance automatically added to current funds with visual badges showing base salary and carryforward breakdown</p>
                  </div>
                  
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">💰 Enhanced Overview</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">New metrics: Remaining amount, Unallocated funds, and visual progress tracking</p>
                  </div>
                  
                  <div className="border-l-4 border-pink-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">📥 Excel Export</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Download comprehensive financial reports with all budgets and entries</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">🎨 UI Improvements</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cleaner, more compact layout with improved spacing and responsive design</p>
                  </div>
                </div>
              </div>
              
              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Start by editing your base salary from the menu to set up your monthly budget</li>
                  <li>• Use the Analytics dashboard to track your spending patterns</li>
                  <li>• Set up recurring budgets once and they'll auto-create each month</li>
                  <li>• Watch for the ⚠️ warning when you reach 80% of an Expense budget</li>
                  <li>• Previous month's balance automatically carries forward to maximize savings</li>
                  <li>• Download Excel reports for tax preparation or external analysis</li>
                </ul>
              </div>
              
              {/* Developer Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                  <span className="font-semibold">Developed by Shannon Dsouza</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Have suggestions or found a bug? Feel free to reach out!
                </p>
              </div>
            </div>
            
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowWhatsNew(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >Got it!</button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (() => {
        // Calculate budget-wise breakdown
        const budgetBreakdown = budgets.map(b => ({
          name: b.name,
          spent: Number(calculateSpent(b.id)),
          allocated: Number(b.total),
          type: b.type
        })).filter(b => b.spent > 0);
        
        const totalSpentForPie = budgetBreakdown.reduce((sum, b) => sum + b.spent, 0);
        
        // Calculate by type
        const typeBreakdown = budgets.reduce((acc, b) => {
          const spent = Number(calculateSpent(b.id));
          if (!acc[b.type]) acc[b.type] = 0;
          acc[b.type] += spent;
          return acc;
        }, {} as Record<string, number>);
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📈 Analytics Dashboard</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl px-2"
                >✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Salary</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">₹{Number(totalSalary).toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Spent</div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">₹{Number(totalSpent).toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 p-4 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Remaining</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">₹{Number(totalAllocated - totalSpent).toLocaleString()}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Savings Rate</div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">{totalSalary > 0 ? Math.round(((totalSalary - totalSpent) / totalSalary) * 100) : 0}%</div>
                  </div>
                </div>
                
                {/* Budget-wise Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Budget-wise Spending Breakdown</h3>
                  <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                    {/* Pie Chart */}
                    <div className="flex-shrink-0">
                      {totalSpentForPie > 0 ? (
                        <svg viewBox="0 0 100 100" width="256" height="256" className="transform -rotate-90">
                            {(() => {
                              let currentAngle = 0;
                              return budgetBreakdown.map((budget, idx) => {
                                const percentage = (budget.spent / totalSpentForPie) * 100;
                                const angle = (percentage / 100) * 360;
                                const startAngle = currentAngle;
                                currentAngle += angle;
                                
                                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                const largeArc = angle > 180 ? 1 : 0;
                                
                                return (
                                  <path
                                    key={budget.name}
                                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                    fill={colors[idx % colors.length]}
                                    stroke="white"
                                    strokeWidth="0.5"
                                  />
                                );
                              });
                            })()}
                          </svg>
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center">No spending data</div>
                      )}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex-1 space-y-2 min-w-0">
                      {budgetBreakdown.map((budget, idx) => {
                        const percentage = totalSpentForPie > 0 ? (budget.spent / totalSpentForPie) * 100 : 0;
                        return (
                          <div key={budget.name} className="flex items-center gap-3 p-2 rounded hover:bg-white dark:hover:bg-gray-800">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{budget.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">₹{budget.spent.toLocaleString()} ({percentage.toFixed(1)}%)</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Type Comparison */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Expense vs Investment vs Savings</h3>
                  <div className="space-y-4">
                    {Object.entries(typeBreakdown).map(([type, amount]) => {
                      const maxAmount = Math.max(...Object.values(typeBreakdown));
                      const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                      let barColor = 'bg-blue-500';
                      if (type === 'Savings') barColor = 'bg-green-500';
                      else if (type === 'Investment') barColor = 'bg-purple-500';
                      else if (type === 'Fixed') barColor = 'bg-orange-500';
                      
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{type}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">₹{Number(amount).toLocaleString()}</span>
                          </div>
                          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-500 flex items-center justify-end pr-3`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && (
                                <span className="text-white text-xs font-semibold">
                                  {totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Monthly Overview */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Current Month Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-3xl mb-2">{budgets.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Budgets</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-3xl mb-2">{entries.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-3xl mb-2">₹{entries.length > 0 ? Math.round(totalSpent / entries.length) : 0}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg per Entry</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-3xl mb-2">{totalSpent > totalAllocated ? '⚠️' : '✅'}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{totalSpent > totalAllocated ? 'Over Budget' : 'On Track'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 px-6 py-4 flex justify-end rounded-b-2xl">
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
