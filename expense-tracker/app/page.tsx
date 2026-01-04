"use client";

import React, { useState } from "react";
import { UserButton } from '@clerk/nextjs';

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

  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Jan
  const [selectedYear, setSelectedYear] = useState(2026);

  /* =======================
     All Data (Key Change)
  ======================= */

  // Backend state
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
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
    // Calculate monthly total as sum of all budget allocations
    setMonthlyTotal(budgetsData.reduce((sum, b) => sum + (Number(b.total) || 0), 0));
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
  const safeMonthlyTotal = isNaN(monthlyTotal) ? 0 : monthlyTotal;
  const safeTotalSpent = isNaN(totalSpent) ? 0 : totalSpent;
  const remaining = safeMonthlyTotal - safeTotalSpent;

  /* =======================
     UI
  ======================= */


  return (
    <main className="min-h-screen bg-[#f3f6fb] p-6 text-gray-900">
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
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="font-bold text-xl mb-4">Add Entry</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Budget</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={addEntryBudgetIndex ?? ''}
                onChange={e => setAddEntryBudgetIndex(Number(e.target.value))}
              >
                {budgets.map((b, i) => (
                  <option key={b.id} value={i}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Title</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={addEntryTitle}
                onChange={e => setAddEntryTitle(e.target.value)}
                placeholder="e.g. Uber, Anime Con"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Amount (₹)</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={addEntryAmount}
                onChange={e => setAddEntryAmount(Number(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full"
                value={addEntryDate}
                onChange={e => setAddEntryDate(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-medium">Notes</label>
              <textarea
                className="border rounded px-3 py-2 w-full"
                value={addEntryNotes}
                onChange={e => setAddEntryNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border"
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
          <h1 className="text-2xl font-bold tracking-tight">Personal Finance Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">Total Monthly Budget:</span>
            <span className="font-bold text-gray-900">₹ {Number(safeMonthlyTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <button
              className="ml-2 text-gray-500 hover:text-gray-700 text-base px-2 py-1 rounded"
              onClick={() => {
                setMonthlyDraft(monthlyTotal);
                setEditingMonthly(true);
              }}
              title="Edit Monthly Budget"
            >✏️</button>
            <span className="font-medium text-gray-700">| Spent:</span>
            <span className="font-bold text-blue-700">₹ {Number(safeTotalSpent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span className="font-medium text-gray-700">| Remaining:</span>
            <span className="font-bold text-green-700">₹ {Number(remaining).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <div className="ml-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border px-3 py-2 rounded-lg bg-white shadow-sm text-lg font-medium"
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
            className="border px-3 py-2 rounded-lg bg-white shadow-sm text-lg font-medium"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </header>

      {/* Edit Monthly Budget Modal */}
      {editingMonthly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow w-full max-w-sm">
            <h2 className="font-semibold mb-4">Edit Monthly Budget</h2>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full mb-4"
              value={monthlyDraft}
              onChange={e => setMonthlyDraft(Number(e.target.value) || 0)}
              min={0}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingMonthly(false)}
                className="border px-3 py-1 rounded"
              >Cancel</button>
              <button
                onClick={() => {
                  setMonthlyTotal(Number(monthlyDraft) || 0);
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
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-500 text-2xl">ⓘ</span>
            <span className="font-semibold text-lg">Overview</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 mb-2">
            <div className="flex gap-4 text-lg font-semibold">
              <span>Total Budget: <span className="text-gray-900 font-bold">₹ {Number(monthlyTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span>Spent: <span className="text-blue-700 font-bold">₹ {Number(totalSpent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
              <span>Remaining: <span className="text-green-700 font-bold">₹ {Number(remaining).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
            </div>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full mb-2">
            <div
              className={`h-4 rounded-full transition-all ${safeMonthlyTotal > 0 && safeTotalSpent / safeMonthlyTotal > 1 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{
                width: `${safeMonthlyTotal > 0 ? Math.min((safeTotalSpent / safeMonthlyTotal) * 100, 100) : 0}%`,
              }}
            />
          </div>
          <div className="text-center text-gray-600 text-sm font-medium">
            {safeMonthlyTotal > 0 ? Math.round((safeTotalSpent / safeMonthlyTotal) * 100) : 0}% of Budget Used
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
              className="relative bg-white rounded-2xl shadow p-5 flex flex-col gap-2 min-h-[180px] hover:shadow-lg transition cursor-pointer group"
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
                  <div className="bg-white rounded-xl p-6 shadow w-full max-w-sm">
                    <h2 className="font-semibold mb-4">Edit Budget</h2>
                    <div className="mb-3">
                      <label className="block mb-1 font-medium">Budget Name</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={budgetNameDraft}
                        onChange={e => setBudgetNameDraft(e.target.value)}
                        placeholder="e.g. Transport, Rent, Investments"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block mb-1 font-medium">Budget Type</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
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
                      <label className="block mb-1 font-medium">Monthly Allocation (₹)</label>
                      <input
                        type="number"
                        className="border rounded px-3 py-2 w-full"
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
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="font-bold text-xl mb-4">Add New Budget</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Budget Name</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={newBudgetName}
                onChange={e => setNewBudgetName(e.target.value)}
                placeholder="e.g. Transport, Rent, Investments"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Budget Type</label>
              <select
                className="border rounded px-3 py-2 w-full"
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
              <label className="block mb-1 font-medium">Monthly Allocation (₹)</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={newBudgetTotal}
                onChange={e => setNewBudgetTotal(Number(e.target.value) || 0)}
                placeholder="e.g. 3000"
                min={0}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border"
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
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">
                {budgets[selectedBudgetIndex].name}
              </h2>
              <button
                onClick={() => setSelectedBudgetIndex(null)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Entries */}
            <ul className="space-y-2 mb-4">
              {getBudgetEntries(budgets[selectedBudgetIndex].id).map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1 rounded-md bg-gray-50 p-2"
                >
                  {editingEntry && editingEntry.id === entry.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={editingEntry.title}
                          onChange={e => setEditingEntry({...editingEntry, title: e.target.value})}
                        />
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={editingEntry.amount}
                          onChange={e => setEditingEntry({...editingEntry, amount: Number(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-40"
                          value={editingEntry.date || ''}
                          onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                        />
                        <input
                          className="border rounded px-2 py-1 w-full"
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
                        <span className="font-semibold text-gray-900">{entry.title}</span>
                        <span className="ml-2 text-gray-400">{entry.date ? new Date(entry.date).toLocaleDateString() : ''}</span>
                        <span className="ml-auto font-semibold text-gray-900">₹{entry.amount.toLocaleString()}</span>
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

            {/* ➕ Add Entry */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Add Entry</h3>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24"
                    placeholder="Amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-40"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 w-full"
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
