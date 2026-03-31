import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { exportToPDF } from '../lib/pdfUtils';
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
  List as ListIcon
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
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('date').reverse().toArray()
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === 'all') return transactions;
    return transactions.filter(tx => tx.type === filter);
  }, [transactions, filter]);

  const stats = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, balance: 0 };
    const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

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

  const handleDelete = async (id: number) => {
    if (confirm(lang === 'bn' ? 'আপনি কি এটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this?')) {
      await db.transactions.delete(id);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await exportToPDF('tracker-content', 'prottoy-report');
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.tracker}</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 transition-opacity",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download size={20} className={isExporting ? "animate-bounce" : ""} />
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
            className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600"
          >
            {viewMode === 'list' ? <PieChartIcon size={20} /> : <ListIcon size={20} />}
          </button>
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
                        onClick={() => tx.id && handleDelete(tx.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
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
          )}
        </AnimatePresence>
      </div>

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
    </div>
  );
}
