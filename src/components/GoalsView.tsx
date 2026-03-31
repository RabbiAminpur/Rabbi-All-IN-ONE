import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Goal } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { Plus, Target, Trash2, Calendar, TrendingUp, PiggyBank, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GoalsView({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState<{ id: number; title: string } | null>(null);
  const [saveAmount, setSaveAmount] = useState('');
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', years: '1', months: '0' });
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const goals = useLiveQuery(() => db.goals.toArray());

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.targetAmount) return;

    const totalMonths = (parseInt(newGoal.years) * 12) + parseInt(newGoal.months);
    if (totalMonths <= 0) return;

    if (editingGoalId) {
      await db.goals.update(editingGoalId, {
        title: newGoal.title,
        targetAmount: parseFloat(newGoal.targetAmount),
        totalMonths: totalMonths
      });
    } else {
      await db.goals.add({
        title: newGoal.title,
        targetAmount: parseFloat(newGoal.targetAmount),
        totalMonths: totalMonths,
        savedAmount: 0,
        createdAt: new Date()
      });
    }

    setNewGoal({ title: '', targetAmount: '', years: '1', months: '0' });
    setEditingGoalId(null);
    setShowAddModal(false);
  };

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSaveModal || !saveAmount) return;

    const goal = await db.goals.get(showSaveModal.id);
    if (goal) {
      await db.goals.update(showSaveModal.id, {
        savedAmount: (goal.savedAmount || 0) + parseFloat(saveAmount)
      });
    }

    setSaveAmount('');
    setShowSaveModal(null);
  };

  const deleteGoal = async (id: number) => {
    await db.goals.delete(id);
    setShowDeleteConfirm(null);
  };

  const getGoalStats = (goal: Goal) => {
    const now = new Date();
    const created = new Date(goal.createdAt);
    const targetDate = new Date(created);
    targetDate.setMonth(created.getMonth() + goal.totalMonths);

    const remainingAmount = Math.max(0, goal.targetAmount - (goal.savedAmount || 0));
    
    // Calculate remaining months
    let diffMonths = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
    const remainingMonths = Math.max(0, diffMonths);

    // Progress percentage
    const progress = Math.min(100, ((goal.savedAmount || 0) / goal.targetAmount) * 100);

    // Required savings based on remaining
    const monthlyNeeded = remainingMonths > 0 ? Math.ceil(remainingAmount / remainingMonths) : remainingAmount;
    const dailyNeeded = remainingMonths > 0 ? Math.ceil(remainingAmount / (remainingMonths * 30)) : Math.ceil(remainingAmount / 30);

    return {
      remainingAmount,
      remainingMonths,
      progress,
      monthlyNeeded,
      dailyNeeded
    };
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="text-amber-500" />
          {t.target}
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-primary text-white rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="grid gap-4">
        {goals?.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <Target size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t.no_data}</p>
          </div>
        ) : (
          goals?.map(goal => {
            const stats = getGoalStats(goal);
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{goal.title}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-400 text-sm">৳ {(goal.savedAmount || 0).toLocaleString()} / ৳ {goal.targetAmount.toLocaleString()}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">
                        {Math.round(stats.progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingGoalId(goal.id!);
                        setNewGoal({
                          title: goal.title,
                          targetAmount: goal.targetAmount.toString(),
                          years: Math.floor(goal.totalMonths / 12).toString(),
                          months: (goal.totalMonths % 12).toString()
                        });
                        setShowAddModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-primary rounded-xl transition-colors"
                    >
                      <TrendingUp size={18} className="rotate-45" />
                    </button>
                    <button 
                      onClick={() => setShowSaveModal({ id: goal.id!, title: goal.title })}
                      className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    >
                      <PiggyBank size={20} />
                    </button>
                    <button 
                      onClick={() => goal.id && setShowDeleteConfirm(goal.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress}%` }}
                    className="h-full bg-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">
                      <Clock size={12} />
                      {t.remaining_time}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {stats.remainingMonths} {t.months}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">
                      <TrendingUp size={12} />
                      {t.remaining_amount}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      ৳ {stats.remainingAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">{t.daily_save}</p>
                    <p className="font-bold text-primary text-sm">৳{stats.dailyNeeded}</p>
                  </div>
                  <div className="text-center border-l border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">{t.monthly_save}</p>
                    <p className="font-bold text-primary text-sm">৳{stats.monthlyNeeded}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
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
                {t.confirm_reset}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'না' : 'No'}
                </button>
                <button 
                  onClick={() => showDeleteConfirm && deleteGoal(showDeleteConfirm)}
                  className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] p-4" onClick={() => { setShowAddModal(false); setEditingGoalId(null); }}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 text-center">{editingGoalId ? t.edit : t.add_target}</h2>
              
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 ml-1">{t.title}</label>
                  <input
                    type="text"
                    required
                    value={newGoal.title}
                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                    placeholder={lang === 'bn' ? 'যেমন: নতুন বাড়ি' : 'e.g. New House'}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 ml-1">{t.target_amount}</label>
                  <input
                    type="number"
                    required
                    value={newGoal.targetAmount}
                    onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                    placeholder="৳ 0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 ml-1">{t.years}</label>
                    <select
                      value={newGoal.years}
                      onChange={e => setNewGoal({ ...newGoal, years: e.target.value })}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                    >
                      {[0, 1, 2, 3, 4, 5, 10].map(y => (
                        <option key={y} value={y}>{y} {t.years}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 ml-1">{t.months}</label>
                    <select
                      value={newGoal.months}
                      onChange={e => setNewGoal({ ...newGoal, months: e.target.value })}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                        <option key={m} value={m}>{m} {t.months}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setEditingGoalId(null); }}
                    className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Savings Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] p-4" onClick={() => setShowSaveModal(null)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-2 text-center">{t.add_savings}</h2>
              <p className="text-slate-500 text-center mb-6">{showSaveModal.title}</p>
              
              <form onSubmit={handleAddSavings} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 ml-1">{t.amount}</label>
                  <input
                    type="number"
                    required
                    autoFocus
                    value={saveAmount}
                    onChange={e => setSaveAmount(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary text-center text-2xl font-bold"
                    placeholder="৳ 0.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(null)}
                    className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
