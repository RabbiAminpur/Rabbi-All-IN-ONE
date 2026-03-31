import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Goal } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { Plus, Target, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GoalsView({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', years: '1' });

  const goals = useLiveQuery(() => db.goals.toArray());

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.targetAmount) return;

    await db.goals.add({
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      years: parseInt(newGoal.years),
      createdAt: new Date()
    });

    setNewGoal({ title: '', targetAmount: '', years: '1' });
    setShowAddModal(false);
  };

  const deleteGoal = async (id: number) => {
    if (confirm(t.confirm_reset)) {
      await db.goals.delete(id);
    }
  };

  const calculateSavings = (amount: number, years: number) => {
    const totalDays = years * 365;
    const totalMonths = years * 12;
    
    return {
      daily: Math.ceil(amount / totalDays),
      monthly: Math.ceil(amount / totalMonths),
      yearly: Math.ceil(amount / years)
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
            const savings = calculateSavings(goal.targetAmount, goal.years);
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{goal.title}</h3>
                    <p className="text-primary font-bold text-xl">৳ {goal.targetAmount.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => goal.id && deleteGoal(goal.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl w-fit">
                  <Calendar size={14} />
                  <span>{goal.years} {t.years}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">{t.daily_save}</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">৳{savings.daily}</p>
                  </div>
                  <div className="text-center border-x border-slate-50 dark:border-slate-800 px-2">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">{t.monthly_save}</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">৳{savings.monthly}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">{t.yearly_save}</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">৳{savings.yearly}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] p-4" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 text-center">{t.add_target}</h2>
              
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

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 ml-1">{t.years}</label>
                  <select
                    value={newGoal.years}
                    onChange={e => setNewGoal({ ...newGoal, years: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 10].map(y => (
                      <option key={y} value={y}>{y} {t.years}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
