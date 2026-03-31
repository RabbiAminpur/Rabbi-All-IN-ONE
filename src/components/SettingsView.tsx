import { translations, type Language } from '../lib/utils';
import { Globe, Moon, Sun, Trash2, Info, ChevronRight } from 'lucide-react';
import { db } from '../lib/db';

export default function SettingsView({ 
  lang, 
  toggleLang, 
  toggleTheme, 
  isDarkMode 
}: { 
  lang: Language, 
  toggleLang: () => void, 
  toggleTheme: () => void,
  isDarkMode: boolean
}) {
  const t = translations[lang];

  const handleReset = async () => {
    if (confirm(t.confirm_reset)) {
      await db.transactions.clear();
      await db.notes.clear();
      await db.budgets.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.settings}</h1>
      </header>

      <div className="space-y-2">
        <section className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <button 
            onClick={toggleLang}
            className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                <Globe size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{t.language}</p>
                <p className="text-xs text-slate-500">{lang === 'bn' ? 'বাংলা' : 'English'}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />

          <button 
            onClick={toggleTheme}
            className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}</p>
                <p className="text-xs text-slate-500">{isDarkMode ? (lang === 'bn' ? 'চালু' : 'On') : (lang === 'bn' ? 'বন্ধ' : 'Off')}</p>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleReset}
            className="w-full p-4 flex items-center justify-between active:bg-red-50 dark:active:bg-red-900/10 transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{t.reset_data}</p>
              </div>
            </div>
          </button>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <Info size={32} />
          </div>
          <h3 className="font-bold text-lg mb-1">Prottoy (প্রত্যয়)</h3>
          <p className="text-slate-500 text-xs mb-4">Version 1.0.0</p>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            {lang === 'bn' 
              ? 'এটি একটি ব্যক্তিগত প্রোডাক্টিভিটি অ্যাপ যা অফলাইনে কাজ করে। আপনার সব তথ্য আপনার ফোনেই সংরক্ষিত থাকে।' 
              : 'A personal productivity app that works offline. All your data stays on your device.'}
          </p>
        </section>
      </div>
    </div>
  );
}
