import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '../lib/db';
import { translations, type Language, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Table as TableIcon, Scale, ChevronRight } from 'lucide-react';

interface JournalEntry {
  date: Date;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  note: string;
}

interface LedgerAccount {
  name: string;
  entries: {
    date: Date;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
  balanceType: 'debit' | 'credit';
}

export default function FinalAccountsView({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'journal' | 'ledger' | 'trial'>('journal');
  const [selectedLedger, setSelectedLedger] = useState<string | null>(null);

  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('date').toArray()
  );

  const journalEntries = useMemo(() => {
    if (!transactions) return [];
    return transactions.map(tx => ({
      date: tx.date,
      debitAccount: tx.type === 'income' ? t.cash_account : tx.category,
      creditAccount: tx.type === 'income' ? tx.category : t.cash_account,
      amount: tx.amount,
      note: tx.note
    }));
  }, [transactions, t]);

  const ledgers = useMemo(() => {
    if (!transactions) return {};
    const ledgerMap: Record<string, LedgerAccount> = {};

    const getOrCreateLedger = (name: string) => {
      if (!ledgerMap[name]) {
        ledgerMap[name] = {
          name,
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
          finalBalance: 0,
          balanceType: 'debit'
        };
      }
      return ledgerMap[name];
    };

    transactions.forEach(tx => {
      const cashLedger = getOrCreateLedger(t.cash_account);
      const categoryLedger = getOrCreateLedger(tx.category);

      if (tx.type === 'income') {
        // Debit Cash, Credit Category
        cashLedger.entries.push({
          date: tx.date,
          particulars: tx.category,
          debit: tx.amount,
          credit: 0,
          balance: 0
        });
        categoryLedger.entries.push({
          date: tx.date,
          particulars: t.cash_account,
          debit: 0,
          credit: tx.amount,
          balance: 0
        });
      } else {
        // Debit Category, Credit Cash
        categoryLedger.entries.push({
          date: tx.date,
          particulars: t.cash_account,
          debit: tx.amount,
          credit: 0,
          balance: 0
        });
        cashLedger.entries.push({
          date: tx.date,
          particulars: tx.category,
          debit: 0,
          credit: tx.amount,
          balance: 0
        });
      }
    });

    // Calculate balances
    Object.values(ledgerMap).forEach(ledger => {
      let runningBalance = 0;
      ledger.entries.sort((a, b) => a.date.getTime() - b.date.getTime()).forEach(entry => {
        ledger.totalDebit += entry.debit;
        ledger.totalCredit += entry.credit;
        runningBalance += (entry.debit - entry.credit);
        entry.balance = runningBalance;
      });
      ledger.finalBalance = Math.abs(runningBalance);
      ledger.balanceType = runningBalance >= 0 ? 'debit' : 'credit';
    });

    return ledgerMap;
  }, [transactions, t]);

  const trialBalance = useMemo(() => {
    const accounts = Object.values(ledgers) as LedgerAccount[];
    const totalDebit = accounts.reduce((acc, curr) => acc + (curr.balanceType === 'debit' ? curr.finalBalance : 0), 0);
    const totalCredit = accounts.reduce((acc, curr) => acc + (curr.balanceType === 'credit' ? curr.finalBalance : 0), 0);
    return { accounts, totalDebit, totalCredit };
  }, [ledgers]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.final_accounts}</h1>
        <div className="flex bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-1">
          <button 
            onClick={() => setActiveTab('journal')}
            className={cn("p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold", activeTab === 'journal' ? "bg-primary text-white" : "text-slate-400")}
          >
            <BookOpen size={16} /> {t.journal}
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={cn("p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold", activeTab === 'ledger' ? "bg-primary text-white" : "text-slate-400")}
          >
            <TableIcon size={16} /> {t.ledger}
          </button>
          <button 
            onClick={() => setActiveTab('trial')}
            className={cn("p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold", activeTab === 'trial' ? "bg-primary text-white" : "text-slate-400")}
          >
            <Scale size={16} /> {t.trial_balance}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'journal' && (
          <motion.div 
            key="journal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">{t.date}</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">{t.particulars}</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">{t.debit}</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">{t.credit}</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map((entry, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="border-b border-slate-50 dark:border-slate-800/50">
                        <td className="p-4 text-xs text-slate-500" rowSpan={2}>
                          {new Date(entry.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                          {entry.debitAccount}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                          ৳{entry.amount.toLocaleString()}
                        </td>
                        <td className="p-4 text-sm text-slate-300 text-right">-</td>
                      </tr>
                      <tr className="border-b border-slate-50 dark:border-slate-800/50">
                        <td className="p-4 text-sm font-medium text-slate-500 pl-8">
                          To {entry.creditAccount}
                        </td>
                        <td className="p-4 text-sm text-slate-300 text-right">-</td>
                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                          ৳{entry.amount.toLocaleString()}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {journalEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 text-sm">{t.no_data}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'ledger' && (
          <motion.div 
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Object.keys(ledgers).map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedLedger(name)}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all",
                    selectedLedger === name 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            {selectedLedger && ledgers[selectedLedger] ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedLedger}</h3>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.ledger}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">{t.date}</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">{t.particulars}</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">{t.debit}</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">{t.credit}</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">{t.balance}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgers[selectedLedger].entries.map((entry, idx) => (
                        <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="p-4 text-xs text-slate-500">
                            {new Date(entry.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                          </td>
                          <td className="p-4 text-sm text-slate-900 dark:text-white">{entry.particulars}</td>
                          <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                            {entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                            {entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-sm font-bold text-primary text-right">
                            ৳{entry.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                        <td colSpan={2} className="p-4 text-sm">{t.total}</td>
                        <td className="p-4 text-sm text-right">৳{ledgers[selectedLedger].totalDebit.toLocaleString()}</td>
                        <td className="p-4 text-sm text-right">৳{ledgers[selectedLedger].totalCredit.toLocaleString()}</td>
                        <td className="p-4 text-sm text-right text-primary">
                          ৳{ledgers[selectedLedger].finalBalance.toLocaleString()} ({ledgers[selectedLedger].balanceType === 'debit' ? 'Dr' : 'Cr'})
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                {lang === 'bn' ? 'একটি খতিয়ান নির্বাচন করুন' : 'Select a ledger to view details'}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'trial' && (
          <motion.div 
            key="trial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.trial_balance}</h3>
              <p className="text-xs text-slate-400 mt-1">{lang === 'bn' ? 'আর্থিক বছরের জন্য' : 'For the current financial period'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase">{lang === 'bn' ? 'হিসাবের নাম' : 'Account Name'}</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">{t.debit} (Dr)</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">{t.credit} (Cr)</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.accounts.map((acc, idx) => (
                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-800/50">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{acc.name}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                        {acc.balanceType === 'debit' ? `৳${acc.finalBalance.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                        {acc.balanceType === 'credit' ? `৳${acc.finalBalance.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 dark:bg-primary/10 font-bold text-primary">
                    <td className="p-4 text-sm uppercase tracking-wider">{t.total}</td>
                    <td className="p-4 text-sm text-right">৳{trialBalance.totalDebit.toLocaleString()}</td>
                    <td className="p-4 text-sm text-right">৳{trialBalance.totalCredit.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {trialBalance.totalDebit !== trialBalance.totalCredit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold text-center">
                {lang === 'bn' ? 'সতর্কতা: রেওয়ামিল মিলছে না!' : 'Warning: Trial Balance is not balanced!'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
