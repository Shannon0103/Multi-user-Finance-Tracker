"use client";

import React, { useState } from "react";
import { UserButton } from '@clerk/nextjs';
import * as XLSX from 'xlsx';

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
        // Dark mode and menu state
        const [isDarkMode, setIsDarkMode] = useState(false);
        const [showMenu, setShowMenu] = useState(false);
        
        // Load dark mode preference from localStorage
        React.useEffect(() => {
          const savedMode = localStorage.getItem('darkMode');
          if (savedMode === 'true') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }, []);
        
        // Toggle dark mode
        const toggleDarkMode = () => {
          const newMode = !isDarkMode;
          setIsDarkMode(newMode);
          localStorage.setItem('darkMode', String(newMode));
          if (newMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        };
        
        // Close menu when clicking outside
        React.useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showMenu && !target.closest('.menu-container')) {
              setShowMenu(false);
            }
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [showMenu]);
        
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
    const budgetsData: Budget[] = await res.json();
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
    <main className="min-h-screen bg-[#f3f6fb] dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100 transition-colors duration-200">
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
            <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Add Entry</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Budget</label>
              <select
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={addEntryBudgetIndex ?? ''}
                onChange={e => setAddEntryBudgetIndex(Number(e.target.value))}
              >
                {budgets.map((b, i) => (
                  <option key={b.id} value={i}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Title</label>
              <input
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={addEntryTitle}
                onChange={e => setAddEntryTitle(e.target.value)}
                placeholder="e.g. Uber, Anime Con"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Amount (₹)</label>
              <input
                type="number"
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={addEntryAmount}
                onChange={e => setAddEntryAmount(Number(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Date</label>
              <input
                type="date"
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={addEntryDate}
                onChange={e => setAddEntryDate(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Notes</label>
              <textarea
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={addEntryNotes}
                onChange={e => setAddEntryNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
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
      <header className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Personal Finance Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700 dark:text-gray-300">Total Salary:</span>
            <span className="font-bold text-gray-900 dark:text-white">₹ {Number(totalSalary).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            {safeCarryforward > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                ↑ ₹{Number(safeCarryforward).toLocaleString()} carried forward
              </span>
            )}
            <button
              className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-base px-2 py-1 rounded"
              onClick={() => {
                setMonthlyDraft(monthlyTotal);
                setEditingMonthly(true);
              }}
              title="Edit Base Salary"
            >✏️</button>
            <span className="font-medium text-gray-700 dark:text-gray-300">| Allocated:</span>
            <span className="font-bold text-purple-700 dark:text-purple-400">₹ {Number(safeTotalAllocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">| Spent:</span>
            <span className="font-bold text-blue-700 dark:text-blue-400">₹ {Number(safeTotalSpent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">| Unallocated:</span>
            <span className="font-bold text-green-700 dark:text-green-400">₹ {Number(unallocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <button
              className="ml-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative menu-container"
              onClick={() => setShowMenu(!showMenu)}
              title="Menu"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="ml-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-lg font-medium dark:text-white"
          >
            {months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-lg font-medium dark:text-white"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </header>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="fixed top-20 right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-64 overflow-hidden menu-container">
          <div className="p-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              onClick={() => {
                downloadExcel();
                setShowMenu(false);
              }}
            >
              <span className="text-2xl">📊</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Download Excel</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Export your data</div>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              onClick={(e) => {
                e.stopPropagation();
                toggleDarkMode();
              }}
            >
              <span className="text-2xl">{isDarkMode ? '☀️' : '🌙'}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Toggle theme</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Edit Monthly Budget Modal */}
      {editingMonthly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl w-full max-w-sm">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Edit Base Salary for {months[selectedMonth]}</h2>
            {safeCarryforward > 0 && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Carryforward from previous month:</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">₹{Number(safeCarryforward).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Current base salary:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">₹{Number(monthlyTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300 dark:border-green-700 mt-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Total Available:</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{Number(totalSalary).toLocaleString()}</span>
                </div>
              </div>
            )}
            <input
              type="number"
              className="border dark:border-gray-600 rounded px-2 py-1 w-full mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={monthlyDraft}
              onChange={e => setMonthlyDraft(Number(e.target.value) || 0)}
              min={0}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingMonthly(false)}
                className="border dark:border-gray-600 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
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
                className="bg-black text-white px-3 py-1 rounded"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Card */}
      <section className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-500 dark:text-blue-400 text-2xl">ⓘ</span>
            <span className="font-semibold text-lg dark:text-white">Budget Overview</span>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-4 text-lg font-semibold">
              <span className="dark:text-gray-200">Total Salary: <span className="text-gray-900 dark:text-white font-bold">₹ {Number(totalSalary).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span className="dark:text-gray-200">Allocated: <span className="text-purple-700 dark:text-purple-400 font-bold">₹ {Number(totalAllocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span className="dark:text-gray-200">Spent: <span className="text-blue-700 dark:text-blue-400 font-bold">₹ {Number(totalSpent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span className="dark:text-gray-200">Unallocated: <span className="text-green-700 dark:text-green-400 font-bold">₹ {Number(unallocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
            </div>
            {safeCarryforward > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded text-green-700 dark:text-green-400 font-medium">
                  💰 Base Salary: ₹{Number(safeMonthlyTotal).toLocaleString()}
                </span>
                <span className="text-gray-400 dark:text-gray-500">+</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-800/40 border border-green-300 dark:border-green-600 rounded text-green-800 dark:text-green-300 font-semibold">
                  ↑ Carryforward: ₹{Number(safeCarryforward).toLocaleString()}
                </span>
                <span className="text-gray-400 dark:text-gray-500">=</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-100 font-bold">
                  Total: ₹{Number(totalSalary).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {/* Three-tier visualization bar */}
          <div className="relative w-full h-6 bg-gray-200 rounded-full mb-2 overflow-hidden">
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
          const percentUsed = safeBudgetTotal > 0 ? Math.min((spent / safeBudgetTotal) * 100, 100) : 0;
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 flex flex-col gap-2 min-h-[180px] hover:shadow-xl transition cursor-pointer group"
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
                  <span className="font-semibold text-lg">{budget.name}</span>
                </div>
                <div className="relative">
                  <button
                    className="budget-menu-btn text-gray-400 hover:text-gray-600 text-xl px-2 py-1 rounded-full focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === index ? null : index);
                    }}
                  >&#8942;</button>
                  {/* Dropdown menu */}
                  {openMenuIndex === index && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
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
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
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
              <div className="font-bold text-lg mb-1">
                ₹{Number(spent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="font-normal text-gray-500">/ ₹{Number(budget.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="block text-xs text-green-700 font-semibold mt-1">Remaining: ₹{Number((safeBudgetTotal - spent)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded-full mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${meta.bar}`}
                  style={{ width: `${safeBudgetTotal > 0 ? Math.min((spent / safeBudgetTotal) * 100, 100) : 0}%` }}
                />
              </div>
              {/* Entry List */}
              <div className="text-right text-xs text-gray-500 mb-1">
                {Math.round(percentUsed)}% of Budget Used
              </div>
              <ul className="text-sm space-y-1">
                {budgetEntries.slice(0, 3).map((entry, i) => (
                  <li key={entry.id} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-700">{entry.title}</span>
                    <span className="ml-2 text-gray-400">{entry.date ? new Date(entry.date).toLocaleDateString() : ''}</span>
                    <span className="ml-2 text-gray-400 italic">{entry.notes ? `(${entry.notes})` : ''}</span>
                    <span className="ml-auto font-semibold text-gray-900">₹{Number(entry.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                    <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Edit Budget</h2>
                    <div className="mb-3">
                      <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Budget Name</label>
                      <input
                        className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={budgetNameDraft}
                        onChange={e => setBudgetNameDraft(e.target.value)}
                        placeholder="e.g. Transport, Rent, Investments"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Budget Type</label>
                      <select
                        className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Monthly Allocation (₹)</label>
                      <input
                        type="number"
                        className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={budgetTotalDraft}
                        onChange={e => setBudgetTotalDraft(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingBudgetIndex(null)}
                        className="border px-3 py-1 rounded"
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
                        className="bg-black text-white px-3 py-1 rounded"
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
            <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Add New Budget</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Budget Name</label>
              <input
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={newBudgetName}
                onChange={e => setNewBudgetName(e.target.value)}
                placeholder="e.g. Transport, Rent, Investments"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Budget Type</label>
              <select
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-200">Monthly Allocation (₹)</label>
              <input
                type="number"
                className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={newBudgetTotal}
                onChange={e => setNewBudgetTotal(Number(e.target.value) || 0)}
                placeholder="e.g. 3000"
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
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
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {budgets[selectedBudgetIndex].name}
              </h2>
              <button
                onClick={() => setSelectedBudgetIndex(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg"
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
                          className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={editingEntry.title}
                          onChange={e => setEditingEntry({...editingEntry, title: e.target.value})}
                        />
                        <input
                          type="number"
                          className="border dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={editingEntry.amount}
                          onChange={e => setEditingEntry({...editingEntry, amount: Number(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="border dark:border-gray-600 rounded px-2 py-1 w-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={editingEntry.date || ''}
                          onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                        />
                        <input
                          className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        <span className="font-semibold text-gray-900 dark:text-white">{entry.title}</span>
                        <span className="ml-2 text-gray-400 dark:text-gray-500">{entry.date ? new Date(entry.date).toLocaleDateString() : ''}</span>
                        <span className="ml-auto font-semibold text-gray-900 dark:text-white">₹{entry.amount.toLocaleString()}</span>
                      </div>
                      {entry.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic pl-1">{entry.notes}</div>
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
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Add Entry</h3>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    className="border dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    className="border dark:border-gray-600 rounded px-2 py-1 w-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                  <input
                    className="border dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
    </main>
  );
}
