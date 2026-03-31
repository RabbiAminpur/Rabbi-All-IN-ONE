import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { Wallet, Notebook, ArrowUpRight, ArrowDownLeft, Plus, Scale } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomeView({ lang, setActiveTab }: { lang: Language, setActiveTab: (tab: any) => void }) {
  const t = translations[lang];
  
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().limit(5).toArray());
  const notesCount = useLiveQuery(() => db.notes.count());
  
  const stats = useLiveQuery(async () => {
    const all = await db.transactions.toArray();
    const income = all.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = all.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'স্বাগতম!' : 'Welcome!'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          P
        </div>
      </header>

      {/* Summary Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-primary p-6 rounded-3xl text-white shadow-xl shadow-primary/20"
      >
        <p className="text-primary-foreground/80 text-sm mb-1">{t.balance}</p>
        <h2 className="text-3xl font-bold mb-6">৳ {stats?.balance.toLocaleString() || 0}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
              <ArrowUpRight size={14} className="text-green-300" />
              {t.income}
            </div>
            <p className="font-bold">৳ {stats?.income.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
              <ArrowDownLeft size={14} className="text-red-300" />
              {t.expense}
            </div>
            <p className="font-bold">৳ {stats?.expense.toLocaleString() || 0}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => setActiveTab('tracker')}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Wallet size={20} />
          </div>
          <p className="font-bold text-[10px] text-center">{t.tracker}</p>
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-600">
            <Notebook size={20} />
          </div>
          <p className="font-bold text-[10px] text-center">{t.notes}</p>
        </button>
        <button 
          onClick={() => setActiveTab('final')}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <Scale size={20} />
          </div>
          <p className="font-bold text-[10px] text-center">{t.final_accounts}</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">{t.recent_transactions}</h3>
          <button onClick={() => setActiveTab('tracker')} className="text-xs text-primary font-medium">{t.all}</button>
        </div>
        
        <div className="space-y-2">
          {transactions?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              {t.no_data}
            </div>
          ) : (
            transactions?.map(tx => (
              <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    tx.type === 'income' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{tx.category}</p>
                    <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={cn("font-bold", tx.type === 'income' ? "text-green-600" : "text-red-600")}>
                  {tx.type === 'income' ? '+' : '-'}৳{tx.amount}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
