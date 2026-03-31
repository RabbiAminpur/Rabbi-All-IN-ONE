import React, { useState, useEffect } from 'react';
import { Home, Wallet, Notebook, Settings, Plus, Target, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './lib/db';
import { translations, type Language, cn } from './lib/utils';

// Views
import HomeView from './components/HomeView';
import TrackerView from './components/TrackerView';
import NotebookView from './components/NotebookView';
import SettingsView from './components/SettingsView';
import GoalsView from './components/GoalsView';
import ProjectBudgetView from './components/ProjectBudgetView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tracker' | 'notes' | 'goals' | 'settings' | 'calculator'>('home');
  const [lang, setLang] = useState<Language>('bn');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const t = translations[lang];

  useEffect(() => {
    // Handle back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (activeTab === 'home') {
        setShowExitModal(true);
        // Push state back to prevent actual browser back
        window.history.pushState({ tab: 'home' }, '');
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Initial state push
    if (window.history.state?.tab !== activeTab) {
      window.history.pushState({ tab: activeTab }, '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
    const savedLang = localStorage.getItem('prottoy_lang') as Language;
    if (savedLang) setLang(savedLang);
    
    const savedTheme = localStorage.getItem('prottoy_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    localStorage.setItem('prottoy_lang', newLang);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('prottoy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('prottoy_theme', 'light');
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home': return <HomeView lang={lang} setActiveTab={setActiveTab} />;
      case 'tracker': return <TrackerView lang={lang} />;
      case 'notes': return <NotebookView lang={lang} />;
      case 'goals': return <GoalsView lang={lang} />;
      case 'calculator': return <ProjectBudgetView lang={lang} onBack={() => setActiveTab('home')} />;
      case 'settings': return (
        <SettingsView 
          lang={lang} 
          toggleLang={toggleLang} 
          toggleTheme={toggleTheme} 
          isDarkMode={isDarkMode} 
          deferredPrompt={deferredPrompt}
          setDeferredPrompt={setDeferredPrompt}
        />
      );
      default: return <HomeView lang={lang} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={cn("min-h-screen pb-24 safe-area-inset-bottom text-slate-900 dark:text-slate-100", isDarkMode ? "dark" : "")}>
      <main className="max-w-md mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB */}
      {activeTab !== 'settings' && activeTab !== 'calculator' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
          aria-label="Add New"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={24} />} 
          label={t.home} 
        />
        <NavButton 
          active={activeTab === 'tracker'} 
          onClick={() => setActiveTab('tracker')} 
          icon={<Wallet size={24} />} 
          label={t.tracker} 
        />
        <NavButton 
          active={activeTab === 'notes'} 
          onClick={() => setActiveTab('notes')} 
          icon={<Notebook size={24} />} 
          label={t.notes} 
        />
        <NavButton 
          active={activeTab === 'goals'} 
          onClick={() => setActiveTab('goals')} 
          icon={<Target size={24} />} 
          label={t.target} 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Settings size={24} />} 
          label={t.settings} 
        />
      </nav>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Home size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">{lang === 'bn' ? 'অ্যাপ থেকে বের হতে চান?' : 'Quit the app?'}</h3>
              <p className="text-slate-500 text-sm mb-6">
                {lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি অ্যাপটি বন্ধ করতে চান?' : 'Are you sure you want to exit the application?'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowExitModal(false)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm text-slate-900 dark:text-white"
                >
                  {lang === 'bn' ? 'না' : 'No'}
                </button>
                <button 
                  onClick={() => {
                    // In a PWA/Browser, we can't really "close" the tab easily
                    // but we can redirect or just hide the app content
                    window.location.href = "about:blank";
                  }}
                  className="py-3 bg-primary text-white rounded-xl font-bold text-sm"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] p-4" onClick={() => setShowAddModal(false)}>
           <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}
           >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 text-center">{lang === 'bn' ? 'নতুন কিছু যোগ করুন' : 'Add Something New'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setActiveTab('tracker'); setShowAddModal(false); }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex flex-col items-center gap-2 border border-blue-100 dark:border-blue-800"
                >
                  <Wallet className="text-blue-600" />
                  <span className="font-medium">{t.tracker}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('notes'); setShowAddModal(false); }}
                  className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex flex-col items-center gap-2 border border-pink-100 dark:border-pink-800"
                >
                  <Notebook className="text-pink-600" />
                  <span className="font-medium">{t.notes}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('goals'); setShowAddModal(false); }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex flex-col items-center gap-2 border border-emerald-100 dark:border-emerald-800"
                >
                  <Target className="text-emerald-600" />
                  <span className="font-medium">{t.target}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('calculator'); setShowAddModal(false); }}
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex flex-col items-center gap-2 border border-purple-100 dark:border-purple-800 col-span-2"
                >
                  <Calculator className="text-purple-600" />
                  <span className="font-medium">{lang === 'bn' ? 'খরচ ক্যালকুলেটর' : 'Expense Calculator'}</span>
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-primary" : "text-slate-400 dark:text-slate-500"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
