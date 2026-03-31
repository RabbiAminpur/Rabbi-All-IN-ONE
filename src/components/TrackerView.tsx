import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction, type Budget } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { exportToPDF, exportDataToPDF } from '../lib/pdfUtils';
import { 
  Plus, 
  Minus, 
  Filter, 
  Download, 
  Trash2, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  PieChart as PieChartIcon,
  List as ListIcon,
  Target
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function TrackerView({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'list' | 'chart' | 'budget'>('list');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'transaction' | 'budget', id: number } | null>(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('date').reverse().toArray()
  );

  const budgets = useLiveQuery(() => 
    db.budgets.where('month').equals(currentMonth).toArray()
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === 'all') return transactions;
    return transactions.filter(tx => tx.type === filter);
  }, [transactions, filter]);

  const stats = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, balance: 0, currentMonthExpense: 0 };
    const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    const currentMonthExpense = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).toISOString().slice(0, 7) === currentMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { income, expense, balance: income - expense, currentMonthExpense };
  }, [transactions, currentMonth]);

  const chartData = useMemo(() => {
    if (!transactions) return [];
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    await db.transactions.add({
      type: formType,
      amount: parseFloat(amount),
      category,
      note,
      date: new Date(date)
    });

    setAmount('');
    setCategory('');
    setNote('');
    setShowAddForm(false);
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetAmount || !budgetCategory) return;

    if (editingBudgetId) {
      await db.budgets.update(editingBudgetId, { 
        amount: parseFloat(budgetAmount),
        category: budgetCategory
      });
    } else {
      await db.budgets.add({
        month: currentMonth,
        category: budgetCategory,
        amount: parseFloat(budgetAmount)
      });
    }
    setShowBudgetForm(false);
    setBudgetAmount('');
    setBudgetCategory('');
    setEditingBudgetId(null);
  };

  const handleDeleteBudget = async (id: number) => {
    await db.budgets.delete(id);
    setShowDeleteConfirm(null);
  };

  const handleDelete = async (id: number) => {
    await db.transactions.delete(id);
    setShowDeleteConfirm(null);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Create a temporary container for A4 export
    const exportContainer = document.createElement('div');
    exportContainer.id = 'pdf-export-container';
    exportContainer.style.position = 'fixed';
    exportContainer.style.left = '-9999px';
    exportContainer.style.top = '0';
    exportContainer.style.width = '210mm'; // A4 width
    exportContainer.style.padding = '20mm';
    exportContainer.style.backgroundColor = 'white';
    exportContainer.style.color = 'black';
    exportContainer.style.fontFamily = 'sans-serif';

    const title = document.createElement('h1');
    title.innerText = lang === 'bn' ? 'রাব্বি - আর্থিক প্রতিবেদন' : 'Rabbi - Financial Report';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    exportContainer.appendChild(title);

    const dateRange = document.createElement('p');
    dateRange.innerText = `${lang === 'bn' ? 'মাস:' : 'Month:'} ${currentMonth}`;
    dateRange.style.marginBottom = '20px';
    exportContainer.appendChild(dateRange);

    const summary = document.createElement('div');
    summary.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <div>
          <p style="color: #666; font-size: 12px; margin: 0;">${t.total_income}</p>
          <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 5px 0;">৳${stats.income.toLocaleString()}</p>
        </div>
        <div>
          <p style="color: #666; font-size: 12px; margin: 0;">${t.total_expense}</p>
          <p style="font-size: 24px; font-weight: bold; color: #f43f5e; margin: 5px 0;">৳${stats.expense.toLocaleString()}</p>
        </div>
        <div>
          <p style="color: #666; font-size: 12px; margin: 0;">${t.balance}</p>
          <p style="font-size: 24px; font-weight: bold; color: #4f46e5; margin: 5px 0;">৳${stats.balance.toLocaleString()}</p>
        </div>
      </div>
    `;
    exportContainer.appendChild(summary);

    const tableTitle = document.createElement('h2');
    tableTitle.innerText = lang === 'bn' ? 'লেনদেনের তালিকা' : 'Transaction List';
    tableTitle.style.fontSize = '18px';
    tableTitle.style.marginBottom = '10px';
    exportContainer.appendChild(tableTitle);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px; text-align: left;">${t.date}</th>
          <th style="padding: 12px; text-align: left;">${t.category}</th>
          <th style="padding: 12px; text-align: left;">${lang === 'bn' ? 'ধরণ' : 'Type'}</th>
          <th style="padding: 12px; text-align: right;">${t.amount}</th>
        </tr>
      </thead>
      <tbody>
        ${filteredTransactions.map(tx => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px;">${new Date(tx.date).toLocaleDateString()}</td>
            <td style="padding: 10px;">${tx.category}</td>
            <td style="padding: 10px; color: ${tx.type === 'income' ? '#10b981' : '#f43f5e'}">${t[tx.type]}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">৳${tx.amount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    exportContainer.appendChild(table);

    document.body.appendChild(exportContainer);
    await exportToPDF('pdf-export-container', `rabbi_report_${currentMonth}`);
    document.body.removeChild(exportContainer);
    setIsExporting(false);
  };

  const handleBudgetExport = () => {
    if (!budgets || budgets.length === 0) return;

    const title = lang === 'bn' ? `বাজেট রিপোর্ট - ${currentMonth}` : `Budget Report - ${currentMonth}`;
    const columns = [
      lang === 'bn' ? 'ক্যাটাগরি' : 'Category',
      lang === 'bn' ? 'বাজেট' : 'Budget',
      lang === 'bn' ? 'ব্যয়' : 'Spent',
      lang === 'bn' ? 'অবশিষ্ট' : 'Remaining',
      lang === 'bn' ? 'অবস্থা' : 'Status'
    ];

    const data = budgets.map(b => {
      const spent = transactions
        ?.filter(t => t.type === 'expense' && t.category === b.category && new Date(t.date).toISOString().slice(0, 7) === currentMonth)
        .reduce((acc, curr) => acc + curr.amount, 0) || 0;
      const remaining = b.amount - spent;
      const progress = (spent / b.amount) * 100;

      return [
        b.category,
        `৳ ${b.amount.toLocaleString()}`,
        `৳ ${spent.toLocaleString()}`,
        `৳ ${remaining.toLocaleString()}`,
        `${progress.toFixed(1)}%`
      ];
    });

    exportDataToPDF(title, columns, data, `budget_report_${currentMonth}`, lang);
  };

  const budgetSummary = useMemo(() => {
    if (!budgets) return { total: 0, spent: 0, progress: 0, isOver: false };
    const total = budgets.reduce((acc, curr) => acc + curr.amount, 0);
    const spent = budgets.reduce((acc, curr) => {
      const categorySpent = transactions
        ?.filter(t => t.type === 'expense' && t.category === curr.category && new Date(t.date).toISOString().slice(0, 7) === currentMonth)
        .reduce((a, c) => a + c.amount, 0) || 0;
      return acc + categorySpent;
    }, 0);
    const progress = total > 0 ? (spent / total) * 100 : 0;
    return { total, spent, progress, isOver: progress > 100 };
  }, [budgets, transactions, currentMonth]);

  const budgetProgress = budgetSummary.progress;
  const isOverBudget = budgetSummary.isOver;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.tracker}</h1>
        <div className="flex gap-2">
          <button 
            onClick={viewMode === 'budget' ? handleBudgetExport : handleExport}
            disabled={isExporting}
            className={cn(
              "p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 transition-opacity",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download size={20} className={isExporting ? "animate-bounce" : ""} />
          </button>
          <div className="flex bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg transition-colors", viewMode === 'list' ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-400")}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('chart')}
              className={cn("p-1.5 rounded-lg transition-colors", viewMode === 'chart' ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-400")}
            >
              <PieChartIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('budget')}
              className={cn("p-1.5 rounded-lg transition-colors", viewMode === 'budget' ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-400")}
            >
              <Target size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-3xl border border-green-100 dark:border-green-900/30">
          <p className="text-green-600 text-xs font-medium mb-1">{t.total_income}</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-400">৳{stats.income.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-3xl border border-red-100 dark:border-red-900/30">
          <p className="text-red-600 text-xs font-medium mb-1">{t.total_expense}</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-400">৳{stats.expense.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter & View */}
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === f ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500"
              )}
            >
              {t[f]}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setFormType('expense'); setShowAddForm(true); }}
          className="flex items-center gap-1 text-xs font-bold text-primary"
        >
          <Plus size={16} /> {lang === 'bn' ? 'যোগ করুন' : 'Add'}
        </button>
      </div>

      <div id="tracker-content">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  {t.no_data}
                </div>
              ) : (
                filteredTransactions.map(tx => (
                  <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center",
                        tx.type === 'income' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{tx.category}</p>
                        <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={cn("font-bold", tx.type === 'income' ? "text-green-600" : "text-red-600")}>
                        {tx.type === 'income' ? '+' : '-'}৳{tx.amount}
                      </p>
                      <button 
                        onClick={() => tx.id && setShowDeleteConfirm({ type: 'transaction', id: tx.id })}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : viewMode === 'chart' ? (
            <motion.div 
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800"
            >
              <h3 className="font-bold text-center mb-6">{lang === 'bn' ? 'ব্যয়ের বিশ্লেষণ' : 'Expense Breakdown'}</h3>
              {chartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {chartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-[10px]">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-500 truncate">{entry.name}</span>
                        <span className="font-bold">৳{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">{t.no_data}</div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="budget"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Total Budget Summary Card */}
              <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-3xl border border-primary/10 dark:border-primary/20">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{lang === 'bn' ? 'মোট বাজেট' : 'Total Budget'}</p>
                    <p className="text-3xl font-bold text-primary">৳{budgetSummary.total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">{lang === 'bn' ? 'মোট ব্যয়' : 'Total Spent'}</p>
                    <p className={cn("text-xl font-bold", isOverBudget ? "text-red-600" : "text-slate-900 dark:text-white")}>
                      ৳{budgetSummary.spent.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
                      className={cn(
                        "h-full rounded-full transition-colors",
                        budgetProgress > 90 ? "bg-red-500" : budgetProgress > 70 ? "bg-amber-500" : "bg-primary"
                      )}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className={cn(isOverBudget ? "text-red-600" : "text-slate-400")}>
                      {budgetProgress.toFixed(1)}% {lang === 'bn' ? 'ব্যবহৃত' : 'Used'}
                    </span>
                    <span className="text-slate-400">
                      {lang === 'bn' ? 'অবশিষ্ট:' : 'Remaining:'} ৳{Math.max(0, budgetSummary.total - budgetSummary.spent).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold">{lang === 'bn' ? 'ক্যাটাগরি ভিত্তিক বাজেট' : 'Category Budgets'}</h3>
                  <button 
                    onClick={() => { 
                      setBudgetAmount(''); 
                      setBudgetCategory(''); 
                      setEditingBudgetId(null);
                      setShowBudgetForm(true); 
                    }}
                    className="text-xs font-bold text-primary flex items-center gap-1"
                  >
                    <Plus size={14} /> {t.set_budget}
                  </button>
                </div>

                {!budgets || budgets.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    {lang === 'bn' ? 'বাজেট সেট করা নেই' : 'No budgets set'}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {budgets.map(b => {
                      const spent = transactions
                        ?.filter(t => t.type === 'expense' && t.category === b.category && new Date(t.date).toISOString().slice(0, 7) === currentMonth)
                        .reduce((acc, curr) => acc + curr.amount, 0) || 0;
                      const progress = (spent / b.amount) * 100;
                      const over = progress > 100;

                      return (
                        <div key={b.id} className="space-y-2 group">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{b.category}</span>
                              <span className="text-[10px] text-slate-400 ml-2">৳{spent.toLocaleString()} / ৳{b.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingBudgetId(b.id!);
                                  setBudgetAmount(b.amount.toString());
                                  setBudgetCategory(b.category);
                                  setShowBudgetForm(true);
                                }}
                                className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {t.edit}
                              </button>
                              <button 
                                onClick={() => b.id && setShowDeleteConfirm({ type: 'budget', id: b.id })}
                                className="text-[10px] font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {t.delete}
                              </button>
                              <span className={cn("text-xs font-bold", over ? "text-red-600" : "text-slate-500")}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(progress, 100)}%` }}
                              className={cn(
                                "h-full rounded-full transition-colors",
                                progress > 90 ? "bg-red-500" : progress > 70 ? "bg-amber-500" : "bg-primary"
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Monthly Summary Bar Chart */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold mb-4">{lang === 'bn' ? 'মাসিক সারসংক্ষেপ' : 'Monthly Summary'}</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: t.income, value: stats.income, fill: '#10b981' },
                      { name: t.expense, value: stats.expense, fill: '#f43f5e' }
                    ]}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">{lang === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}</h3>
              <p className="text-slate-500 text-sm mb-6">
                {lang === 'bn' ? 'এটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This action cannot be undone.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'না' : 'No'}
                </button>
                <button 
                  onClick={() => {
                    if (showDeleteConfirm.type === 'budget') handleDeleteBudget(showDeleteConfirm.id);
                    else handleDelete(showDeleteConfirm.id);
                  }}
                  className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-6" onClick={() => setShowAddForm(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{formType === 'income' ? t.add_income : t.add_expense}</h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setFormType('income')}
                  className={cn("px-3 py-1 rounded-md text-xs font-bold transition-all", formType === 'income' ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" : "text-slate-400")}
                >
                  <Plus size={14} />
                </button>
                <button 
                  onClick={() => setFormType('expense')}
                  className={cn("px-3 py-1 rounded-md text-xs font-bold transition-all", formType === 'expense' ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-400")}
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t.amount}</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary text-lg font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t.category}</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: খাবার, যাতায়াত' : 'e.g. Food, Travel'}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t.date}</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-500"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-2 p-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-6" onClick={() => { setShowBudgetForm(false); setEditingBudgetId(null); }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">{editingBudgetId ? t.edit : t.set_budget}</h2>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t.category}</label>
                <input 
                  type="text" 
                  value={budgetCategory}
                  onChange={e => setBudgetCategory(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: মোবাইল বিল' : 'e.g. Mobile Bill'}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t.amount}</label>
                <input 
                  type="number" 
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary text-lg font-bold"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => { setShowBudgetForm(false); setEditingBudgetId(null); }}
                  className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-500"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-2 p-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
